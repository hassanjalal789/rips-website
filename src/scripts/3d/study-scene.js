// Home "students at work" scene (motion storyboard S1–S3). The hero and the "Your path at RIPS"
// chapters share one canvas: five small dioramas of students studying stand on floating navy
// platforms joined by a gold path, and the camera glides from one to the next as the visitor
// scrolls. Everything is built from primitives in code, so there is no model or texture to
// download. Decorative only: the canvas is aria-hidden and the chapter text carries the meaning.
// The figures are generic and faceless on purpose; they are not photographs of RIPS students.
//
// Usage:
//   const study = mountStudy(canvas, { reducedMotion });
//   study.setProgress(p); // 0 = hero, 1–5 = chapters 01–05; fractions glide between them
//   study.destroy();
// Loaded on capable devices only, after the page has rendered (src/scripts/home.js).

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const STUDY_STOPS = 6;

const C = {
  night: 0x071726, navy: 0x0d2740, navyTop: 0x15324f, navyMid: 0x1d3a5c, blue: 0x2f5f8f, sky: 0x9ec7ea,
  gold: 0xe1c482, goldDeep: 0xb8924a, ivory: 0xf1ead9, white: 0xf4f2ec, ink: 0x18212c, hair: 0x1e1915,
  skin: [0xc68e5e, 0x9c6644, 0xdba97f, 0x7d4f32], cream: 0xe9dcc0, maroon: 0x6e2f3a, teal: 0x3f8f9a,
};

export function mountStudy(canvas, { reducedMotion = false, pixelRatioCap = 1.75 } = {}) {
  const big = Math.max(window.innerWidth, window.innerHeight) >= 1000 && (navigator.hardwareConcurrency || 4) >= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, big ? pixelRatioCap : 1.5));
  renderer.shadowMap.enabled = big;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.night, 11, 30); // the next platform fades into the navy
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  // Procedural environment for the gold and glass: no HDR file to download.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(C.navy);
  for (const [color, x, y, z, s] of [[0xfff0cc, 4, 3, 3, 2.6], [C.gold, 0, 6, 0, 2.4], [0x6fa8dc, -5, -1, -2, 2.2]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color }));
    m.position.set(x, y, z); m.scale.setScalar(s); envScene.add(m);
  }
  const envTexture = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.55;

  // ---------- Small factories: shared materials and geometries keep memory and draw setup low ----------
  const materials = new Map();
  function mat(color, { rough = 0.72, metal = 0, emissive = 0x000000, glow = 1, opacity = 1, side } = {}) {
    const key = [color, rough, metal, emissive, glow, opacity, side].join();
    if (!materials.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: glow });
      if (opacity < 1) Object.assign(m, { transparent: true, opacity, depthWrite: false });
      if (side) m.side = side;
      materials.set(key, m);
    }
    return materials.get(key);
  }
  const gold = () => mat(C.gold, { rough: 0.3, metal: 0.85 });
  const glass = () => mat(0xcfe6f7, { rough: 0.05, metal: 0.1, opacity: 0.32 });
  const geometries = new Map();
  const geo = (key, make) => { if (!geometries.has(key)) geometries.set(key, make()); return geometries.get(key); };
  const rbox = (w, h, d, r = 0.02) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)));
  const cyl = (rt, rb, h, s = 24) => geo(`cy${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
  const sph = (r, w = 24, h = 16) => geo(`sp${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
  const capsule = (r, h) => geo(`ca${r},${h}`, () => new THREE.CapsuleGeometry(r, h, 6, 16));
  const lathe = (key, pts, s = 32) => geo(key, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s));
  function mesh(g, m, parent, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent?.add(o);
    return o;
  }
  const group = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent?.add(g); return g; };

  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const glowTexture = canvasTexture(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,236,190,1)'); r.addColorStop(0.35, 'rgba(225,196,130,.45)'); r.addColorStop(1, 'rgba(225,196,130,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  const shadowTexture = canvasTexture(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(0,8,18,.55)'); r.addColorStop(1, 'rgba(0,8,18,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  function glow(parent, x, y, z, size, opacity = 1) {
    const s = new THREE.Sprite(glowMaterial.clone());
    s.material.opacity = opacity;
    s.position.set(x, y, z); s.scale.setScalar(size); parent.add(s);
    return s;
  }
  // Soft contact shadow, so figures sit on the platform even where real shadows are off (phones).
  const blobMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  function blob(parent, x, z, sx, sz = sx) {
    const m = new THREE.Mesh(geo('blob', () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), blobMaterial);
    m.position.set(x, 0.012, z); m.scale.set(sx, 1, sz); m.renderOrder = 1; parent.add(m);
    return m;
  }

  // ---------- People: a simple jointed figure, posed and animated in code ----------
  const torsoGeo = lathe('torso', [[0, 0], [0.13, 0], [0.15, 0.06], [0.142, 0.2], [0.163, 0.36], [0.152, 0.44], [0.09, 0.5], [0, 0.515]]);
  const coatGeo = lathe('coat', [[0.152, 0.02], [0.17, -0.12], [0.2, -0.4], [0.215, -0.52]]);
  const gownGeo = lathe('gown', [[0.1, 0.5], [0.17, 0.44], [0.19, 0.2], [0.23, -0.2], [0.27, -0.6], [0.29, -0.84]]);
  const drapeGeo = lathe('drape', [[0.075, 0.02], [0.115, -0.04], [0.19, -0.12], [0.215, -0.17], [0.2, -0.2]]);
  const hairGeo = geo('hair', () => new THREE.SphereGeometry(0.124, 28, 16, 0, Math.PI * 2, 0, 1.78));

  function person({ skin, top = C.navyMid, legs = C.ink, hair = 'short', hairColor = C.hair, scarf = C.cream, coat = false, gown = false, glasses = false, seated = true }) {
    const p = { root: new THREE.Group() };
    const hips = p.hips = group(p.root, 0, seated ? 0.47 : 0.9, 0);
    const shirt = mat(coat ? C.white : gown ? 0x274a72 : top, { rough: 0.85 });
    const skinMat = mat(skin, { rough: 0.6 });
    mesh(torsoGeo, shirt, hips).scale.set(1, 1, 0.78);
    if (coat && !seated) mesh(coatGeo, mat(C.white, { rough: 0.85, side: THREE.DoubleSide }), hips).scale.set(1, 1, 0.8);
    if (gown) {
      mesh(gownGeo, mat(0x274a72, { rough: 0.75, side: THREE.DoubleSide }), hips).scale.set(1, 1, 0.82);
      for (const side of [-1, 1]) { // gold stole
        const stole = mesh(rbox(0.075, 0.55, 0.012, 0.004), mat(C.gold, { rough: 0.35, metal: 0.6, emissive: 0x4a3a12 }), hips, side * 0.07, 0.18, 0.13);
        stole.rotation.x = -0.12;
      }
    }
    if (coat) mesh(rbox(0.012, 0.05, 0.03, 0.004), gold(), hips, -0.085, 0.36, 0.125); // pen in the pocket
    const headPivot = p.head = group(hips, 0, 0.56, 0);
    if (hair !== 'hijab') mesh(cyl(0.045, 0.05, 0.09, 16), skinMat, hips, 0, 0.53, 0);
    const head = group(headPivot, 0, 0.06, 0);
    if (hair === 'hijab') {
      const cloth = mat(scarf, { rough: 0.9 });
      mesh(sph(0.128, 28, 20), cloth, head).scale.set(0.95, 1.07, 1);
      mesh(sph(0.1, 24, 16), skinMat, head, 0, -0.008, 0.078).scale.set(0.78, 0.98, 0.6);
      mesh(drapeGeo, mat(scarf, { rough: 0.9, side: THREE.DoubleSide }), headPivot, 0, -0.01, 0).scale.set(1, 1, 0.82);
    } else {
      mesh(sph(0.115, 28, 20), skinMat, head).scale.set(0.93, 1.06, 0.98);
      const cap = mesh(hairGeo, mat(hairColor, { rough: 0.55 }), head, 0, 0.012, -0.008);
      cap.rotation.x = -0.5;
      if (hair === 'bun') mesh(sph(0.055), mat(hairColor, { rough: 0.55 }), head, 0, 0.1, -0.1);
    }
    if (glasses) {
      for (const side of [-1, 1]) {
        const ring = mesh(geo('lens', () => new THREE.TorusGeometry(0.028, 0.005, 6, 20)), gold(), head, side * 0.04, 0.012, 0.106);
        ring.castShadow = false;
      }
    }
    if (gown) {
      const board = group(head, 0, 0.1, 0);
      mesh(cyl(0.1, 0.11, 0.06, 20), mat(C.navy, { rough: 0.7 }), board);
      const top = mesh(rbox(0.3, 0.018, 0.3, 0.004), mat(C.navy, { rough: 0.7 }), board, 0, 0.035, 0);
      top.rotation.y = Math.PI / 4;
      mesh(sph(0.012), gold(), board, 0, 0.048, 0);
      mesh(cyl(0.006, 0.006, 0.13, 6), gold(), board, 0.1, -0.03, 0.1);
      p.cap = board;
    }
    const sleeve = mat(coat ? C.white : gown ? 0x274a72 : top, { rough: 0.85 });
    p.arms = [-1, 1].map((side) => {
      const shoulder = group(hips, 0.172 * side, 0.43, 0);
      mesh(capsule(0.048, 0.2), sleeve, shoulder, 0, -0.12, 0);
      const elbow = group(shoulder, 0, -0.25, 0);
      mesh(capsule(0.042, 0.17), sleeve, elbow, 0, -0.1, 0);
      const hand = group(elbow, 0, -0.225, 0);
      mesh(sph(0.045, 16, 12), skinMat, hand).scale.set(0.85, 1.1, 0.75);
      return { shoulder, elbow, hand, side };
    });
    const legMat = mat(gown ? C.navy : legs, { rough: 0.8 });
    p.legs = [-1, 1].map((side) => {
      const hip = group(hips, 0.085 * side, 0.02, 0);
      mesh(capsule(0.066, 0.3), legMat, hip, 0, -0.2, 0);
      const knee = group(hip, 0, -0.42, 0);
      mesh(capsule(0.056, 0.3), legMat, knee, 0, -0.2, 0);
      mesh(rbox(0.1, 0.07, 0.22, 0.03), mat(C.ink, { rough: 0.5 }), knee, 0, -0.43, 0.05);
      if (seated) { hip.rotation.x = -Math.PI / 2; knee.rotation.x = Math.PI / 2; hip.rotation.z = side * 0.06; }
      return { hip, knee };
    });
    blob(p.root, 0, seated ? 0.12 : 0, 0.9, seated ? 1 : 0.8);
    return p;
  }
  // Arms are posed with three angles: forward swing, sideways spread and elbow bend (radians).
  function pose(arm, forward, spread, bend, twist = 0) {
    arm.shoulder.rotation.set(-forward, twist * arm.side, spread * arm.side);
    arm.elbow.rotation.set(-bend, 0, 0);
  }

  // ---------- Props ----------
  function platform(parent, radius) {
    const g = group(parent);
    const profile = [[0, -0.34], [radius * 0.84, -0.34], [radius, -0.14], [radius, -0.03], [radius - 0.03, 0], [0, 0]];
    mesh(lathe(`plat${radius}`, profile, 96), mat(C.navy, { rough: 0.5, metal: 0.3 }), g).castShadow = false;
    mesh(cyl(radius - 0.12, radius - 0.12, 0.012, 96), mat(C.navyTop, { rough: 0.8 }), g, 0, 0.006, 0).castShadow = false;
    const ring = mesh(geo(`ring${radius}`, () => new THREE.TorusGeometry(radius - 0.06, 0.014, 8, 160)), mat(C.gold, { rough: 0.3, metal: 0.8, emissive: 0x6b5418, glow: 0.6 }), g, 0, 0.012, 0);
    ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    const under = mesh(geo(`under${radius}`, () => new THREE.TorusGeometry(radius * 0.84, 0.01, 6, 120)), mat(C.gold, { emissive: C.gold, glow: 1.2 }), g, 0, -0.34, 0);
    under.rotation.x = Math.PI / 2; under.castShadow = false;
    return g;
  }
  function chair(parent, x, z, rotY, color = C.navyMid) {
    const c = group(parent, x, 0, z);
    c.rotation.y = rotY;
    mesh(rbox(0.46, 0.06, 0.44, 0.025), mat(color, { rough: 0.6 }), c, 0, 0.42, 0);
    mesh(rbox(0.46, 0.4, 0.05, 0.025), mat(color, { rough: 0.6 }), c, 0, 0.68, -0.21);
    for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) mesh(cyl(0.014, 0.014, 0.41, 8), gold(), c, lx, 0.2, lz);
    blob(c, 0, 0, 0.75);
    return c;
  }
  function table(parent, x, z, w, d, h = 0.74) {
    const t = group(parent, x, 0, z);
    mesh(rbox(w, 0.05, d, 0.02), mat(C.ivory, { rough: 0.45 }), t, 0, h, 0);
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(cyl(0.017, 0.017, h - 0.02, 8), gold(), t, lx * (w / 2 - 0.06), (h - 0.02) / 2, lz * (d / 2 - 0.06));
    blob(t, 0, 0, w * 1.2, d * 1.4);
    return t;
  }
  function closedBook(parent, x, y, z, color, w = 0.17, h = 0.035, d = 0.24) {
    const b = group(parent, x, y, z);
    mesh(rbox(w, h, d, 0.006), mat(color, { rough: 0.6 }), b, 0, h / 2, 0);
    mesh(rbox(w - 0.012, h * 0.7, d - 0.014, 0.003), mat(C.ivory, { rough: 0.9 }), b, 0.007, h / 2, 0);
    mesh(rbox(0.012, h * 1.02, d * 1.0, 0.004), gold(), b, -w / 2 + 0.004, h / 2, 0); // gilt spine
    return b;
  }
  // An open book whose top page turns every few seconds (the page bends as it turns).
  function openBook(parent, x, y, z, coverColor) {
    const b = group(parent, x, y, z);
    mesh(rbox(0.46, 0.012, 0.32, 0.005), mat(coverColor, { rough: 0.6 }), b, 0, 0.006, 0);
    for (const side of [-1, 1]) {
      const block = mesh(rbox(0.215, 0.02, 0.3, 0.006), mat(C.ivory, { rough: 0.9 }), b, side * 0.112, 0.021, 0);
      block.rotation.z = -side * 0.035;
    }
    const N = 10, W = 0.21, D = 0.29;
    const positions = new Float32Array((N + 1) * 2 * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const index = [];
    for (let i = 0; i < N; i++) { const a = i * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    g.setIndex(index);
    const page = mesh(g, mat(0xfbf6ea, { rough: 0.9, side: THREE.DoubleSide }), b, 0, 0.033, 0);
    page.castShadow = false;
    const CYCLE = 5.5, FLIP = 1.3;
    function set(angle) {
      const curl = 0.75 * Math.sin(angle);
      let px = 0, py = 0;
      for (let i = 0; i <= N; i++) {
        for (let r = 0; r < 2; r++) positions.set([px, py, (r - 0.5) * D], (i * 2 + r) * 3);
        const theta = Math.max(0, angle - curl * (i / N));
        px += (W / N) * Math.cos(theta); py += (W / N) * Math.sin(theta);
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
    }
    set(0);
    return {
      group: b,
      // 0..1 while the page is turning, otherwise -1.
      phase: (t) => { const k = (t % CYCLE) / FLIP; return k <= 1 ? k : -1; },
      update(t) {
        const k = Math.min(1, (t % CYCLE) / FLIP);
        set(Math.PI * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2));
      },
    };
  }
  function laptop(parent, x, y, z, rotY = 0) {
    const l = group(parent, x, y, z);
    l.rotation.y = rotY;
    mesh(rbox(0.34, 0.016, 0.24, 0.006), mat(0x2a3542, { rough: 0.35, metal: 0.6 }), l, 0, 0.008, 0);
    const hinge = group(l, 0, 0.016, -0.115);
    hinge.rotation.x = -0.32;
    mesh(rbox(0.34, 0.23, 0.012, 0.006), mat(0x2a3542, { rough: 0.35, metal: 0.6 }), hinge, 0, 0.115, 0);
    const screen = canvasTexture(256, 160, (g, w, h) => {
      g.fillStyle = '#0d2740'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e1c482'; g.fillRect(16, 16, 90, 10);
      g.fillStyle = '#5f86ad';
      for (let i = 0; i < 4; i++) g.fillRect(16, 40 + i * 16, 120 - i * 18, 7);
      g.fillStyle = '#e1c482';
      [40, 62, 50, 84, 72].forEach((v, i) => g.fillRect(150 + i * 18, 140 - v, 11, v));
    });
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.2), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
    display.position.set(0, 0.115, 0.0065); hinge.add(display);
    return l;
  }
  function lamp(parent, x, y, z) {
    const l = group(parent, x, y, z);
    mesh(cyl(0.07, 0.08, 0.025, 24), gold(), l, 0, 0.012, 0);
    const a1 = mesh(cyl(0.011, 0.011, 0.36, 8), gold(), l, 0.04, 0.18, 0); a1.rotation.z = -0.25;
    const head = group(l, 0.09, 0.35, 0.02);
    const a2 = mesh(cyl(0.011, 0.011, 0.26, 8), gold(), head, -0.05, 0.02, 0.07); a2.rotation.set(1.2, 0, -0.5);
    const shade = group(head, -0.12, 0.0, 0.15);
    shade.rotation.set(0.5, 0, 0.35);
    mesh(geo('shade', () => new THREE.CylinderGeometry(0.035, 0.1, 0.12, 28, 1, true)), mat(C.gold, { rough: 0.3, metal: 0.85, side: THREE.DoubleSide }), shade);
    mesh(sph(0.03), mat(0xfff2cf, { emissive: 0xffe2a8, glow: 2.4 }), shade, 0, -0.03, 0);
    const light = new THREE.PointLight(0xffd892, 1.6, 2.6, 2);
    light.position.set(0, -0.08, 0); shade.add(light);
    const halo = glow(shade, 0, -0.07, 0, 0.55, 0.8);
    return { group: l, halo };
  }
  function mug(parent, x, y, z) {
    const m = group(parent, x, y, z);
    mesh(cyl(0.04, 0.036, 0.1, 20), mat(C.ivory, { rough: 0.4 }), m, 0, 0.05, 0);
    mesh(geo('mugring', () => new THREE.TorusGeometry(0.04, 0.004, 6, 24)), gold(), m, 0, 0.1, 0).rotation.x = Math.PI / 2;
    mesh(geo('handle', () => new THREE.TorusGeometry(0.025, 0.007, 6, 16, Math.PI)), mat(C.ivory, { rough: 0.4 }), m, 0.045, 0.05, 0).rotation.z = -Math.PI / 2;
    return m;
  }
  const BOOK_COLORS = [C.navy, C.gold, C.blue, C.maroon, C.cream, C.navyMid, C.goldDeep, C.teal];

  // ---------- The five dioramas ----------
  const stops = [];
  function diorama(x, y, z, rotY, radius = 2.1) {
    const d = group(scene, x, y, z);
    d.rotation.y = rotY;
    platform(d, radius);
    return d;
  }

  // 01: a student reading at a desk under a gold lamp, books circling overhead (hero and chapter 01).
  {
    const d = diorama(0, 0, 0, 0, 1.75);
    const desk = table(d, 0, 0.32, 1.4, 0.72);
    chair(d, 0, -0.32, 0);
    const s = person({ skin: C.skin[0], top: 0xe9e2d0, hair: 'hijab', scarf: C.blue });
    s.root.position.set(0, 0, -0.26); d.add(s.root);
    const book = openBook(desk, 0, 0.765, -0.06, C.navy);
    const lampProp = lamp(desk, -0.5, 0.765, -0.12);
    laptop(desk, 0.42, 0.765, -0.02, -0.45);
    closedBook(desk, 0.5, 0.765, 0.22, C.blue);
    closedBook(desk, 0.49, 0.8, 0.22, C.gold).rotation.y = 0.12;
    closedBook(desk, 0.5, 0.835, 0.22, C.maroon).rotation.y = -0.08;
    mug(desk, -0.28, 0.765, 0.2);
    // Books orbiting above, gently opening and closing.
    const orbit = group(d, 0, 1.62, 0.1);
    const flyers = [C.gold, C.navyMid, C.blue, C.maroon].map((color, i) => {
      const f = group(orbit);
      const halves = [-1, 1].map((side) => {
        const h = group(f);
        mesh(rbox(0.12, 0.01, 0.17, 0.004), mat(color, { rough: 0.5, metal: color === C.gold ? 0.6 : 0 }), h, side * 0.06, 0, 0);
        mesh(rbox(0.112, 0.012, 0.158, 0.003), mat(C.ivory, { rough: 0.9 }), h, side * 0.058, -0.011, 0);
        return h;
      });
      return { f, halves, phase: (i / 4) * Math.PI * 2 };
    });
    stops.push({
      group: d, ty: 0.95,
      update(t) {
        book.update(t);
        const f = book.phase(t);
        const turn = f < 0 ? 0 : Math.sin(f * Math.PI);
        s.hips.rotation.x = 0.17 + 0.012 * Math.sin(t * 1.7);
        s.head.rotation.x = 0.36 + 0.03 * Math.sin(t * 0.9) - 0.06 * turn;
        s.head.rotation.y = 0.05 * Math.sin(t * 0.4) + 0.12 * turn;
        pose(s.arms[0], 1.05, 0.2, 0.95);
        pose(s.arms[1], 1.05 + 0.25 * turn, 0.22 - 0.2 * turn, 0.95 - 0.25 * turn);
        lampProp.halo.material.opacity = 0.75 + 0.05 * Math.sin(t * 3);
        orbit.rotation.y = t * 0.25;
        flyers.forEach(({ f: fl, halves, phase }) => {
          const a = phase;
          fl.position.set(Math.cos(a) * 0.95, 0.1 * Math.sin(t * 1.1 + phase * 2), Math.sin(a) * 0.95);
          fl.rotation.set(0.15 * Math.sin(t * 0.7 + phase), -a, 0.2 * Math.sin(t * 0.8 + phase));
          const open = 0.45 + 0.25 * Math.sin(t * 2.2 + phase); // wing beat
          halves[0].rotation.z = open; halves[1].rotation.z = -open;
        });
      },
    });
  }

  // 02: a lecture: a teacher at a board that draws itself, two students taking notes.
  {
    const d = diorama(8.6, -0.35, -3.8, -0.35);
    const board = group(d, -0.25, 0, -0.95);
    mesh(rbox(1.7, 0.98, 0.06, 0.03), mat(C.navy, { rough: 0.5 }), board, 0, 1.45, 0);
    mesh(rbox(1.6, 0.88, 0.02, 0.01), mat(0x123352, { rough: 0.9 }), board, 0, 1.45, 0.025);
    for (const lx of [-0.75, 0.75]) mesh(cyl(0.02, 0.02, 0.96, 8), gold(), board, lx, 0.48, 0);
    // The drawing: a hexagon ring molecule and a rising line, revealed stroke by stroke.
    const pts = [];
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; pts.push(new THREE.Vector3(-0.42 + Math.cos(a) * 0.2, 1.48 + Math.sin(a) * 0.2, 0.04)); }
    const ring = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0);
    const chart = new THREE.CatmullRomCurve3([[0.05, 1.18], [0.22, 1.32], [0.36, 1.27], [0.52, 1.5], [0.68, 1.72]].map(([px, py]) => new THREE.Vector3(px, py, 0.04)), false, 'catmullrom', 0.1);
    const strokeMat = mat(C.gold, { emissive: C.gold, glow: 0.9, rough: 0.5 });
    const strokes = [ring, chart].map((curve) => {
      const g = new THREE.TubeGeometry(curve, 120, 0.011, 6, false);
      const m = mesh(g, strokeMat, board); m.castShadow = false;
      return { g, total: g.index.count };
    });
    const axes = mesh(rbox(0.66, 0.008, 0.008, 0.002), strokeMat, board, 0.38, 1.14, 0.04); axes.castShadow = false;
    const teacher = person({ skin: C.skin[3], top: C.navyMid, legs: C.navy, hair: 'short', glasses: true, seated: false });
    teacher.root.position.set(0.8, 0, -0.55); teacher.root.rotation.y = -0.55; d.add(teacher.root);
    const students = [[-0.55, 0.62, C.skin[2], 'bun', C.blue], [0.45, 0.82, C.skin[1], 'hijab', C.navyMid]].map(([x, z, skin, hair, top]) => {
      table(d, x, z - 0.42, 0.7, 0.45, 0.68);
      chair(d, x, z, Math.PI);
      const s = person({ skin, top, hair, scarf: C.blue });
      s.root.position.set(x, 0, z - 0.06); s.root.rotation.y = Math.PI; d.add(s.root);
      closedBook(d, x - 0.12, 0.705, z - 0.48, C.gold, 0.2, 0.012, 0.26).rotation.y = 0.2;
      mesh(rbox(0.012, 0.012, 0.14, 0.004), gold(), d, x + 0.08, 0.715, z - 0.46).rotation.y = 0.5;
      return s;
    });
    stops.push({
      group: d, ty: 1.0,
      update(t) {
        const k = (t % 7) / 5.5;
        strokes[0].g.setDrawRange(0, Math.floor(strokes[0].total * Math.min(1, k * 2)));
        strokes[1].g.setDrawRange(0, Math.floor(strokes[1].total * Math.min(1, Math.max(0, k * 2 - 1))));
        const point = 0.5 + 0.5 * Math.sin(t * 0.8);
        pose(teacher.arms[0], 0.25, 0.1, 0.3);
        pose(teacher.arms[1], 1.5 + 0.35 * point, -0.35, 0.25);
        teacher.head.rotation.y = -0.5 + 0.9 * point;
        teacher.hips.rotation.y = 0.15 * point;
        students.forEach((s, i) => {
          const write = Math.sin(t * 7 + i);
          s.hips.rotation.x = 0.12;
          s.head.rotation.x = i === 0 ? 0.15 + 0.25 * (Math.sin(t * 0.7) > 0 ? 1 : 0) : 0.3;
          pose(s.arms[0], 0.95, 0.15, 1.05);
          pose(s.arms[1], 0.95 + 0.04 * write, 0.15, 1.05 + 0.05 * write);
        });
        // The first student raises a hand now and then.
        const raise = Math.max(0, Math.sin(t * 0.45 - 1)) ** 2;
        pose(students[0].arms[1], 0.95 + 2.0 * raise, 0.15, 1.05 - 0.9 * raise);
      },
    });
  }

  // 03: the lab: one student at a microscope, one swirling a flask, a molecule turning overhead.
  {
    const d = diorama(17.2, 0.2, 0.4, 0.3);
    const bench = group(d, 0, 0, -0.3);
    mesh(rbox(1.7, 0.06, 0.66, 0.02), mat(C.ivory, { rough: 0.4 }), bench, 0, 0.9, 0);
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(rbox(0.05, 0.87, 0.05, 0.015), mat(C.navyMid, { rough: 0.6 }), bench, lx * 0.79, 0.435, lz * 0.27);
    mesh(rbox(1.6, 0.03, 0.56, 0.01), mat(C.navyMid, { rough: 0.6 }), bench, 0, 0.22, 0);
    [[-0.55, 0x7a4a24], [-0.42, 0x2f5f8f], [0.5, 0x7a4a24]].forEach(([bx, color]) => {
      mesh(cyl(0.045, 0.045, 0.16, 16), mat(color, { rough: 0.15, metal: 0.1, opacity: 0.85 }), bench, bx, 0.315, 0.05);
      mesh(cyl(0.02, 0.02, 0.04, 12), mat(C.ink), bench, bx, 0.415, 0.05);
    });
    blob(bench, 0, 0, 2.1, 1);
    const scope = group(bench, -0.36, 0.93, -0.16);
    mesh(rbox(0.16, 0.03, 0.2, 0.01), mat(C.white, { rough: 0.4 }), scope, 0, 0.015, 0);
    const arm = mesh(rbox(0.04, 0.26, 0.05, 0.015), mat(C.white, { rough: 0.4 }), scope, 0, 0.15, -0.06); arm.rotation.x = 0.2;
    mesh(rbox(0.12, 0.012, 0.1, 0.004), mat(C.ink), scope, 0, 0.11, 0.02);
    const tube = mesh(cyl(0.022, 0.026, 0.16, 16), gold(), scope, 0, 0.28, 0.0); tube.rotation.x = -0.45;
    mesh(cyl(0.016, 0.016, 0.05, 12), mat(C.ink), scope, 0, 0.36, -0.04).rotation.x = -0.45;
    const knob = mesh(cyl(0.025, 0.025, 0.02, 12), gold(), scope, 0.035, 0.13, -0.05); knob.rotation.z = Math.PI / 2;
    // Glassware with glowing liquid.
    const rack = group(bench, 0.35, 0.93, -0.12);
    mesh(rbox(0.32, 0.02, 0.08, 0.006), gold(), rack, 0, 0.06, 0);
    [C.gold, C.sky, C.teal, C.gold].forEach((color, i) => {
      const x = -0.12 + i * 0.08;
      mesh(cyl(0.017, 0.017, 0.16, 12), glass(), rack, x, 0.08, 0).castShadow = false;
      mesh(cyl(0.014, 0.014, 0.07 + i * 0.012, 12), mat(color, { emissive: color, glow: 0.35, rough: 0.2 }), rack, x, 0.035 + (i * 0.006), 0);
    });
    const flaskGeo = lathe('flask', [[0.0, 0], [0.08, 0], [0.085, 0.01], [0.03, 0.12], [0.022, 0.14], [0.022, 0.2]], 28);
    const liquidGeo = lathe('liquid', [[0, 0.004], [0.074, 0.004], [0.077, 0.012], [0.045, 0.075], [0, 0.075]], 28);
    const flaskA = group(bench, 0.05, 0.93, 0.1);
    mesh(flaskGeo, glass(), flaskA).castShadow = false;
    mesh(liquidGeo, mat(C.gold, { emissive: C.gold, glow: 0.5, rough: 0.2 }), flaskA);
    const bubbles = Array.from({ length: 6 }, (_, i) => ({ m: mesh(sph(0.008, 8, 6), mat(0xfff4d6, { emissive: 0xffe9b5, glow: 0.8 }), flaskA), o: i / 6 }));
    glow(flaskA, 0, 0.06, 0, 0.45, 0.5);
    const a = person({ skin: C.skin[1], hair: 'bun', coat: true, seated: false });
    a.root.position.set(-0.36, 0, -0.8); d.add(a.root);
    const b = person({ skin: C.skin[2], hair: 'hijab', scarf: C.navyMid, coat: true, seated: false });
    b.root.position.set(0.48, 0, -0.76); b.root.rotation.y = -0.3; d.add(b.root);
    const held = group(b.arms[1].hand, 0, -0.03, 0.02);
    mesh(flaskGeo, glass(), held).castShadow = false;
    mesh(liquidGeo, mat(C.sky, { emissive: C.sky, glow: 0.45, rough: 0.2 }), held);
    // The molecule: gold atoms and bonds, slowly turning above the bench.
    const molecule = group(d, 0.1, 1.95, -0.3);
    const atoms = [[0, 0, 0], [0.22, 0.1, 0], [-0.2, 0.12, 0.08], [0.05, -0.22, 0.1], [0.4, -0.05, 0.12], [-0.38, 0.0, -0.05], [0.1, 0.3, -0.15]];
    const bonds = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [1, 6]];
    atoms.forEach(([x, y, z], i) => mesh(sph(i % 3 === 0 ? 0.06 : 0.045), i % 2 ? mat(C.sky, { rough: 0.2, metal: 0.2 }) : gold(), molecule, x, y, z).castShadow = false);
    const up = new THREE.Vector3(0, 1, 0);
    bonds.forEach(([i, j]) => {
      const p = new THREE.Vector3(...atoms[i]), q = new THREE.Vector3(...atoms[j]);
      const bond = mesh(cyl(0.012, 0.012, p.distanceTo(q), 8), mat(C.goldDeep, { rough: 0.35, metal: 0.7 }), molecule);
      bond.position.copy(p).add(q).multiplyScalar(0.5);
      bond.quaternion.setFromUnitVectors(up, q.clone().sub(p).normalize());
      bond.castShadow = false;
    });
    glow(molecule, 0, 0, 0, 1.4, 0.35);
    stops.push({
      group: d, ty: 1.1,
      update(t) {
        a.hips.rotation.x = 0.42 + 0.03 * Math.sin(t * 0.8);
        a.head.rotation.x = 0.55;
        pose(a.arms[0], 0.95, 0.12, 0.6);
        pose(a.arms[1], 1.05, -0.05, 0.7 + 0.04 * Math.sin(t * 2.5));
        a.arms[1].hand.rotation.y = 0.6 * Math.sin(t * 2.5);
        knob.rotation.x = t * 1.5;
        const swirl = t * 3.2;
        b.head.rotation.x = 0.35; b.head.rotation.y = -0.15;
        pose(b.arms[0], 0.25, 0.1, 0.35);
        pose(b.arms[1], 0.75 + 0.06 * Math.sin(swirl), 0.15 + 0.06 * Math.cos(swirl), 1.25);
        held.rotation.set(0.2 * Math.sin(swirl), 0, 0.2 * Math.cos(swirl));
        bubbles.forEach((bb) => {
          const k = (t * 0.45 + bb.o) % 1;
          bb.m.position.set(0.025 * Math.sin(bb.o * 20 + t), 0.01 + k * 0.17, 0.025 * Math.cos(bb.o * 13));
          bb.m.scale.setScalar(0.6 + k);
        });
        molecule.rotation.set(0.3 * Math.sin(t * 0.3), t * 0.35, 0);
        molecule.position.y = 1.95 + 0.06 * Math.sin(t * 0.9);
      },
    });
  }

  // 04: studying together by the library shelves: typing, reading and writing round a table.
  {
    const d = diorama(25.8, -0.3, -4.2, -0.25, 2.2);
    // Curved shelves with books, as one instanced mesh.
    const shelfMat = mat(C.navyMid, { rough: 0.6 });
    const books = [];
    for (let u = 0; u < 3; u++) {
      const a = -0.75 + u * 0.75;
      const unit = group(d, Math.sin(a) * 1.55, 0, -Math.cos(a) * 1.55);
      unit.rotation.y = -a;
      mesh(rbox(1.08, 1.9, 0.04, 0.015), shelfMat, unit, 0, 0.95, -0.15);
      for (const sx of [-0.52, 0.52]) mesh(rbox(0.04, 1.9, 0.34, 0.015), shelfMat, unit, sx, 0.95, 0);
      mesh(rbox(1.08, 0.04, 0.34, 0.015), shelfMat, unit, 0, 1.88, 0);
      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const y = 0.16 + sIdx * 0.44;
        mesh(rbox(0.98, 0.025, 0.3, 0.008), gold(), unit, 0, y, 0.03);
        let x = -0.46;
        while (x < 0.44) {
          const w = 0.035 + ((x * 1000 + sIdx * 37 + u * 11) % 7) * 0.006;
          const h = 0.26 + ((x * 700 + sIdx * 13) % 5) * 0.022;
          books.push({ unit, x: x + w / 2, y: y + 0.0125 + h / 2, w, h, c: BOOK_COLORS[Math.abs(Math.floor(x * 97 + sIdx * 3 + u)) % BOOK_COLORS.length] });
          x += w + 0.006;
        }
      }
    }
    const inst = new THREE.InstancedMesh(rbox(1, 1, 0.22, 0.004), mat(0xffffff, { rough: 0.6 }), books.length);
    const m4 = new THREE.Matrix4(), color = new THREE.Color();
    books.forEach((bk, i) => {
      bk.unit.updateMatrix();
      m4.makeScale(bk.w, bk.h, 1).setPosition(bk.x, bk.y, 0.0).premultiply(bk.unit.matrix);
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, color.setHex(bk.c));
    });
    inst.castShadow = inst.receiveShadow = true;
    d.add(inst);
    // Round table and three students.
    const top = group(d, 0, 0, 0.35);
    mesh(cyl(0.6, 0.6, 0.05, 48), mat(C.ivory, { rough: 0.45 }), top, 0, 0.72, 0);
    mesh(cyl(0.05, 0.07, 0.7, 16), gold(), top, 0, 0.35, 0);
    mesh(cyl(0.28, 0.3, 0.03, 32), gold(), top, 0, 0.015, 0);
    blob(top, 0, 0, 1.6);
    const seats = [[Math.PI + 1.1, C.skin[1], 'short', C.blue], [Math.PI, C.skin[0], 'hijab', C.navyMid], [Math.PI - 1.1, C.skin[2], 'bun', C.maroon]];
    const ring3 = seats.map(([a, skin, hair, shirt], i) => {
      const x = Math.sin(a) * 0.95, z = Math.cos(a) * 0.95;
      chair(top, x, z, a + Math.PI);
      const s = person({ skin, top: shirt, hair, scarf: i === 1 ? C.gold : C.cream });
      s.root.position.set(Math.sin(a) * 0.88, 0, Math.cos(a) * 0.88);
      s.root.rotation.y = a + Math.PI;
      top.add(s.root);
      return s;
    });
    laptop(top, Math.sin(seats[0][0]) * 0.36, 0.745, Math.cos(seats[0][0]) * 0.36, seats[0][0]);
    const reading = closedBook(ring3[1].arms[1].hand, 0, 0, 0, C.gold, 0.17, 0.03, 0.24);
    reading.position.set(-0.06, -0.06, 0.04); reading.rotation.set(1.2, 0, 0.1);
    const pad = closedBook(top, Math.sin(seats[2][0]) * 0.36, 0.745, Math.cos(seats[2][0]) * 0.36, C.ivory, 0.2, 0.01, 0.26);
    pad.rotation.y = seats[2][0];
    const pen = mesh(cyl(0.006, 0.006, 0.13, 6), gold(), ring3[2].arms[0].hand, 0, -0.03, 0.03);
    pen.rotation.x = 0.9;
    // One book drifts from the shelf to the table and back.
    const flying = closedBook(d, 0, 0, 0, C.blue);
    stops.push({
      group: d, ty: 0.95,
      update(t) {
        const [typist, reader, writer] = ring3;
        typist.hips.rotation.x = 0.15;
        typist.head.rotation.x = 0.28;
        typist.head.rotation.y = Math.sin(t * 0.5) > 0.6 ? -0.5 : 0;
        pose(typist.arms[0], 1.0, 0.18, 1.0 + 0.06 * Math.sin(t * 11));
        pose(typist.arms[1], 1.0, 0.18, 1.0 + 0.06 * Math.sin(t * 11 + 1.5));
        reader.hips.rotation.x = -0.05;
        reader.head.rotation.x = 0.3 + 0.03 * Math.sin(t);
        reader.head.rotation.y = Math.sin(t * 0.5 + 2) > 0.7 ? 0.45 : 0;
        pose(reader.arms[0], 0.9, 0.05, 1.45);
        pose(reader.arms[1], 0.9, 0.05, 1.45);
        writer.hips.rotation.x = 0.2;
        writer.head.rotation.x = 0.42;
        pose(writer.arms[1], 0.85, 0.2, 1.0);
        pose(writer.arms[0], 0.95 + 0.03 * Math.sin(t * 6), 0.12 + 0.04 * Math.sin(t * 3), 1.0 + 0.05 * Math.cos(t * 6));
        const k = (Math.sin(t * 0.5) + 1) / 2;
        const e = k * k * (3 - 2 * k);
        flying.position.set(0.15 + 0.2 * e, 1.25 + 0.55 * Math.sin(e * Math.PI), -1.2 + 1.45 * e);
        flying.rotation.set(0.4 * Math.sin(e * Math.PI), t * 0.6, 0.3 * Math.sin(e * Math.PI));
      },
    });
  }

  // 05: graduation: two graduates in navy and gold, one throwing a cap, gold confetti falling.
  {
    const d = diorama(34.4, 0.1, 0.2, 0.2);
    const steps = group(d, 0, 0, -0.45);
    mesh(rbox(1.9, 0.14, 0.9, 0.03), mat(C.navyMid, { rough: 0.6 }), steps, 0, 0.07, 0);
    mesh(rbox(1.5, 0.12, 0.55, 0.03), mat(C.navyMid, { rough: 0.6 }), steps, 0, 0.2, -0.12);
    mesh(rbox(1.92, 0.012, 0.012, 0.004), gold(), steps, 0, 0.14, 0.45);
    const g1 = person({ skin: C.skin[0], hair: 'hijab', scarf: C.cream, gown: true, seated: false });
    g1.root.position.set(-0.38, 0.14, -0.08); g1.root.rotation.y = 0.25; d.add(g1.root);
    const g2 = person({ skin: C.skin[3], hair: 'short', gown: true, seated: false });
    g2.root.position.set(0.4, 0.14, -0.04); g2.root.rotation.y = -0.2; d.add(g2.root);
    const diploma = group(g1.arms[1].hand, 0, -0.03, 0.03);
    mesh(cyl(0.022, 0.022, 0.26, 12), mat(C.ivory, { rough: 0.7 }), diploma).rotation.z = Math.PI / 2;
    mesh(cyl(0.026, 0.026, 0.03, 12), gold(), diploma).rotation.z = Math.PI / 2;
    // g2's cap leaves the head on the throw and comes back.
    const cap = g2.cap;
    const capHome = cap.position.clone();
    const confetti = new THREE.InstancedMesh(geo('confetti', () => new THREE.PlaneGeometry(0.035, 0.02)), mat(C.gold, { metal: 0.7, rough: 0.35, side: THREE.DoubleSide, emissive: 0x3a2a08 }), 70);
    const bits = Array.from({ length: 70 }, (_, i) => ({ x: Math.sin(i * 12.9898) * 1.4, z: Math.cos(i * 78.233) * 1.1, o: (i * 0.6180339) % 1, s: 0.5 + ((i * 7) % 5) / 5 }));
    confetti.castShadow = false;
    d.add(confetti);
    const q = new THREE.Quaternion(), e3 = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), m4 = new THREE.Matrix4();
    stops.push({
      group: d, ty: 1.15,
      update(t) {
        const k = (t % 4.5) / 4.5;
        const throwing = k < 0.5 ? Math.sin((k / 0.5) * Math.PI) : 0;
        pose(g2.arms[1], 0.4 + 2.6 * Math.min(1, k * 6) * (k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) * 5)), -0.15, 0.2);
        pose(g2.arms[0], 0.2, 0.15, 0.25);
        g2.head.rotation.x = -0.35 * throwing;
        cap.position.set(capHome.x, capHome.y + 1.1 * throwing, capHome.z + 0.05 * throwing);
        cap.rotation.set(0.6 * throwing, 4 * Math.PI * Math.min(1, k * 2), 0.3 * throwing);
        pose(g1.arms[1], 2.4 + 0.15 * Math.sin(t * 1.5), -0.25, 0.3);
        pose(g1.arms[0], 0.15, 0.12, 0.2);
        g1.head.rotation.x = -0.15; g1.head.rotation.y = -0.25 + 0.15 * Math.sin(t * 0.6);
        bits.forEach((b, i) => {
          const f = (t * 0.12 * b.s + b.o) % 1;
          pos.set(b.x + 0.1 * Math.sin(t + i), 2.6 - f * 2.6, b.z);
          q.setFromEuler(e3.set(t * 2 * b.s + i, t * 1.3 + i, 0));
          confetti.setMatrixAt(i, m4.compose(pos, q, sc));
        });
        confetti.instanceMatrix.needsUpdate = true;
      },
    });
  }

  // ---------- The gold path between the platforms, with a light travelling along it ----------
  const centres = stops.map((s) => s.group.position);
  const pathPoints = [];
  centres.forEach((c, i) => {
    const next = centres[i + 1];
    pathPoints.push(new THREE.Vector3(c.x, c.y - 0.25, c.z));
    if (next) pathPoints.push(new THREE.Vector3((c.x + next.x) / 2, (c.y + next.y) / 2 - 0.9, (c.z + next.z) / 2 + 1.2));
  });
  const path = new THREE.CatmullRomCurve3(pathPoints, false, 'centripetal');
  const DOTS = 260;
  const dots = new THREE.InstancedMesh(sph(0.022, 8, 6), mat(C.gold, { emissive: C.gold, glow: 0.9 }), DOTS);
  const dm = new THREE.Matrix4();
  for (let i = 0; i < DOTS; i++) dots.setMatrixAt(i, dm.makeTranslation(path.getPointAt(i / (DOTS - 1))));
  scene.add(dots);
  const comet = glow(scene, 0, 0, 0, 0.9, 0.9);

  // Floating gold dust across the whole journey.
  const DUST = big ? 520 : 260;
  const dustPositions = new Float32Array(DUST * 3);
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // deterministic, so posters match
  for (let i = 0; i < DUST; i++) dustPositions.set([-6 + rand() * 48, -1.5 + rand() * 5, -9 + rand() * 13], i * 3);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ map: glowTexture, color: C.gold, size: 0.07, transparent: true, depthWrite: false, opacity: 0.8, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // ---------- Lights: a warm key that follows the camera's focus, a cool sky and a gold rim ----------
  scene.add(new THREE.HemisphereLight(0xcfe0f2, 0x0b1a2a, 0.7));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.3);
  key.castShadow = big;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2.8, right: 2.8, top: 2.8, bottom: -2.8, near: 1, far: 16 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(C.gold, 1.7);
  scene.add(rim, rim.target);

  // ---------- Camera stops: where the camera stands for the hero and each chapter ----------
  // [diorama, azimuth, elevation, distance]; the azimuth is measured from the diorama's front.
  const VIEWS = [[0, 0.62, 0.28, 5.7], [0, -0.45, 0.4, 5.3], [1, 0.42, 0.3, 6.0], [2, -0.38, 0.42, 5.6], [3, 0.55, 0.34, 6.4], [4, -0.3, 0.3, 5.6]];
  const keyframes = VIEWS.map(([i, az, el, dist]) => {
    const s = stops[i];
    const target = s.group.position.clone().add(new THREE.Vector3(0, s.ty, 0));
    const a = az + s.group.rotation.y;
    const position = target.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(a) * Math.cos(el) * dist));
    return { position, target, stop: i };
  });
  const camPath = new THREE.CatmullRomCurve3(keyframes.map((k) => k.position), false, 'centripetal');
  const lookPath = new THREE.CatmullRomCurve3(keyframes.map((k) => k.target), false, 'centripetal');

  let width = 1, height = 1, wide = true;
  function layout() {
    width = canvas.clientWidth || 1; height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 42 : 30;
    wide = camera.aspect >= 1.1;
  }
  // The subject sits beside the text: to the right on wide screens. On phones it sits below the
  // hero's headline, then above each chapter's text.
  function frameSubject(p) {
    const x = wide ? -0.15 : 0;
    const y = wide ? 0 : THREE.MathUtils.lerp(-0.27, 0.17, THREE.MathUtils.clamp(p, 0, 1));
    camera.setViewOffset(width, height, x * width, y * height, width, height);
  }

  // ---------- Loop ----------
  let progress = 0, progressTarget = 0, elapsed = 0, pointerX = 0, pointerY = 0, aimX = 0, aimY = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), lift = new THREE.Vector3();
  function place(p) {
    const u = p / (STUDY_STOPS - 1);
    camPath.getPoint(u, camPos);
    lookPath.getPoint(u, camLook);
    // A small rise between stops gives each move a gentle arc.
    const between = Math.sin((p % 1) * Math.PI);
    camPos.y += 0.6 * between;
    if (!wide) camPos.sub(camLook).multiplyScalar(1.12).add(camLook); // a little more room on phones
    camPos.add(lift.set(pointerX * 0.25, -pointerY * 0.15, 0));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    frameSubject(p);
    key.position.copy(camLook).add(lift.set(2.5, 5.5, 3.5));
    key.target.position.copy(camLook);
    rim.position.copy(camLook).add(lift.set(-3.5, 2.5, -4.5));
    rim.target.position.copy(camLook);
    const c = (elapsed * 0.035) % 1;
    comet.position.copy(path.getPointAt(c));
  }
  function animate(t) {
    for (let i = 0; i < stops.length; i++) {
      const near = Math.abs(keyframes[Math.round(progress)].stop - i) <= 1;
      if (near) stops[i].update(t);
    }
    dust.rotation.y = Math.sin(t * 0.05) * 0.02;
    dust.position.y = Math.sin(t * 0.2) * 0.1;
  }
  stops.forEach((s) => { s.base = s.group.position.y; });
  const bob = (t) => stops.forEach((s, i) => { s.group.position.y = s.base + 0.05 * Math.sin(t * 0.6 + i); });

  const onPointer = (e) => { aimX = (e.clientX / window.innerWidth - 0.5) * 2; aimY = (e.clientY / window.innerHeight - 0.5) * 2; };
  if (!reducedMotion) window.addEventListener('pointermove', onPointer, { passive: true });

  let running = false, raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    progress += (progressTarget - progress) * Math.min(1, dt * 4);
    pointerX += (aimX - pointerX) * 0.05; pointerY += (aimY - pointerY) * 0.05;
    animate(elapsed);
    bob(elapsed);
    place(progress);
    renderer.render(scene, camera);
  }
  function start() { if (!running && !reducedMotion) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function renderStill() { animate(elapsed); place(progress); renderer.render(scene, camera); }

  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()));
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  const ro = new ResizeObserver(() => { layout(); if (!running) renderStill(); });
  ro.observe(canvas);
  layout();
  elapsed = 1.2; // a pose with the page mid-turn for the first frame and the posters
  renderStill();

  return {
    // Reduced motion: no glide, the view cuts to the nearest stop.
    setProgress(p) {
      progressTarget = Math.max(0, Math.min(STUDY_STOPS - 1, p));
      if (reducedMotion) { progress = Math.round(progressTarget); renderStill(); }
    },
    // For posters and tests: show stop p at time t, without the loop.
    renderAt(p, t = 1.2) { stop(); progress = progressTarget = p; elapsed = t; renderStill(); },
    destroy() {
      stop(); io.disconnect(); ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      geometries.forEach((g) => g.dispose());
      scene.traverse((o) => { if (o.isMesh && !geometries.has(o.geometry)) o.geometry.dispose(); });
      materials.forEach((m) => m.dispose());
      [glowTexture, shadowTexture, envTexture].forEach((t) => t.dispose());
      pmrem.dispose(); renderer.dispose();
    },
  };
}
