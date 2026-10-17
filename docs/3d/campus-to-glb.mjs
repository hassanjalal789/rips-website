// Turns the SketchUp campus model (exported as triangles by the SketchUp session, see
// README.md) into the compressed GLB the Campus Explorer loads. Dev-only: needs `three` and
// `@gltf-transform/{core,extensions,functions}` installed wherever you run it.
//
//   node docs/3d/campus-to-glb.mjs docs/3d/campus-sketchup-export.json src/assets/3d/campus.glb
//
// SketchUp is Z-up in inches; glTF is Y-up in metres. The site's centre goes to the origin.
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize } from '@gltf-transform/functions';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node campus-to-glb.mjs <export.json> <out.glb>');

// GLTFExporter reads its binary output through FileReader, which Node does not have.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.(); }); }
};

const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const IN = 0.0254;
const [siteW, siteD] = data.site_m ?? [90, 62]; // metres
const SITE_CENTRE = { x: siteW / 2, y: siteD / 2 };
const toThree = (x, y, z) => [x * IN - SITE_CENTRE.x, z * IN, -(y * IN - SITE_CENTRE.y)];

function geometryFrom(tris, offset = [0, 0, 0], smooth = false) {
  const pos = new Float32Array(tris.length);
  for (let i = 0; i < tris.length; i += 3) {
    const p = toThree(tris[i] + offset[0], tris[i + 1] + offset[1], tris[i + 2] + offset[2]);
    pos.set(p, i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  // Round parts (columns, dome, shrubs) shade smoothly but keep crisp edges at their flat caps.
  return smooth ? toCreasedNormals(g, Math.PI / 3) : g;
}

const PBR = {
  Placeholder_Stone: { roughness: 0.85, metalness: 0 },
  Placeholder_Stone_Shade: { roughness: 0.9, metalness: 0 },
  Glazing_Navy: { roughness: 0.12, metalness: 0.2 },
  Accent_Gold: { roughness: 0.45, metalness: 0.2 },
  Ground: { roughness: 1, metalness: 0 },
  Paving: { roughness: 0.95, metalness: 0 },
  Tree_Canopy: { roughness: 0.9, metalness: 0 },
  Tree_Trunk: { roughness: 0.95, metalness: 0 },
  Render_White: { roughness: 0.85, metalness: 0 },
  Brick_Red: { roughness: 0.9, metalness: 0 },
  Trim_Navy: { roughness: 0.6, metalness: 0 },
  Sign_Green: { roughness: 0.5, metalness: 0 },
  Glass_Dark: { roughness: 0.1, metalness: 0.3 },
  Glass_Lit: { roughness: 0.3, metalness: 0, emissive: 0x6b5a3a },
  Roof_Metal: { roughness: 0.45, metalness: 0.35 },
  Ground_Grass: { roughness: 1, metalness: 0 },
  Paver_Grey: { roughness: 0.95, metalness: 0 },
  Paver_Red: { roughness: 0.95, metalness: 0 },
  Topiary_Green: { roughness: 0.9, metalness: 0 },
  Solar_Blue: { roughness: 0.2, metalness: 0.5 },
  Tank_Blue: { roughness: 0.5, metalness: 0 },
  Dome_White: { roughness: 0.6, metalness: 0 },
  Plant_Grey: { roughness: 0.7, metalness: 0.2 },
  Crest_Gold: { roughness: 0.35, metalness: 0.6 },
};
const materials = {};
for (const [name, [r, g, b, a]] of Object.entries(data.materials)) {
  const m = new THREE.MeshStandardMaterial({ name, ...(PBR[name] ?? { roughness: 0.8 }) });
  m.color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
  if (a < 255) { m.transparent = true; m.opacity = a / 255; }
  materials[name] = m;
}

const root = new THREE.Group();
root.name = 'Campus_RIPS';
root.userData = { source: data.source ?? 'placeholder', note: 'Sizes and the Admission Office position are estimates.' };

// One mesh per building and material keeps draw calls low and the buildings selectable.
const parts = new Map();
for (const mesh of data.meshes) {
  const building = mesh.path.split('/')[1];
  const key = `${building}|${mesh.mat}`;
  if (!parts.has(key)) parts.set(key, []);
  parts.get(key).push(geometryFrom(mesh.tris, [0, 0, 0], mesh.smooth));
}
// Trees and shrubs: bake every instance (translation only) into one mesh per material.
for (const inst of data.instances) {
  const offset = [inst.m[12], inst.m[13], inst.m[14]];
  for (const part of data.definitions[inst.def]) {
    const key = `Planting|${part.mat}`;
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key).push(geometryFrom(part.tris, offset, part.smooth));
  }
}
const buildings = new Map();
for (const [key, geoms] of parts) {
  const [building, mat] = key.split('|');
  if (!buildings.has(building)) {
    const node = new THREE.Group();
    node.name = building;
    buildings.set(building, node);
    root.add(node);
  }
  const mesh = new THREE.Mesh(mergeGeometries(geoms), materials[mat]);
  mesh.name = `${building}_${mat}`;
  buildings.get(building).add(mesh);
}

const box = new THREE.Box3().setFromObject(root);
console.log('bounds (m)', box.min.toArray().map((v) => +v.toFixed(2)), box.max.toArray().map((v) => +v.toFixed(2)));

const glb = await new GLTFExporter().parseAsync(root, { binary: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.readBinary(new Uint8Array(glb));
// KHR_mesh_quantization: smaller vertex data that three.js's GLTFLoader reads with no extra decoder.
await doc.transform(dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
const bytes = await io.writeBinary(doc);
fs.writeFileSync(output, bytes);
console.log(`${output}: ${(bytes.byteLength / 1024).toFixed(1)} KB (uncompressed export ${(glb.byteLength / 1024).toFixed(1)} KB)`);
