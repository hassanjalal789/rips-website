# 3D assets: how they were made

Everything here is **PLACEHOLDER** until RIPS confirms the real campus layout and photos. Nothing
in the model or its hotspots is a fact about the campus. Photography budget is OD-12; the campus
layout itself has no open decision yet and needs an owner (proposed: Director).

| File | What it is |
| --- | --- |
| `campus-sketchup-export.json` | Triangles, materials and tree instances exported from the SketchUp model (inches, Z up). |
| `campus-sketchup-view.png` | SketchUp's own render of that model. |
| `campus-to-glb.mjs` | Turns the export into `src/assets/3d/campus-placeholder.glb` (metres, Y up, quantised). |

## The placeholder campus

Built with the Trimble SketchUp connector as simple massing on a 90 m × 62 m site:

- **Main_Block_Labs**: 44 m × 14 m, three floors, rooftop plant box.
- **Library_Wing**: 18 m × 20 m, two floors, full-height glass corner.
- **Classroom_Block**: 30 m × 12 m, two floors.
- **Admissions_Entrance**: gold canopy on two columns in front of the main block.
- Ten trees (one component, ten instances), a paved plaza and a front path.

SketchUp's cloud connector saves only `.skp`, so the geometry was exported as triangles from the
live model and converted with three.js `GLTFExporter`, then `@gltf-transform` (dedup, prune and
`KHR_mesh_quantization`, which three.js's `GLTFLoader` reads without an extra decoder).

## Rebuild the GLB

```sh
npm i --no-save three @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
node docs/3d/campus-to-glb.mjs docs/3d/campus-sketchup-export.json src/assets/3d/campus-placeholder.glb
```

## Budgets (CR-01 against NFR-PERF-02)

| Asset | Size | Budget |
| --- | --- | --- |
| `campus-placeholder.glb` | ~55 KB | ≤ ~1 MB compressed |
| `hero-scene.js` (needs three.js, bundled once with the explorer) | ~8 KB source | loaded after first paint, capable devices only |

Hotspots live in `src/assets/3d/campus-hotspots.json`. Their labels follow the facilities named in
the RIPS campus tour video (YouTube, 1 Nov 2025; `facts_source` in the file), which also gives the
site as 12 kanal (about 6,000 m²). Where each facility sits is unknown, so each `summary` is a visible
`[TO CONFIRM — …]` placeholder.
