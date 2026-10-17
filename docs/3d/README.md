# 3D assets: how they were made

The Campus Explorer model follows the RIPS campus tour video (Radiant University Sheikhupura
YouTube channel, 1 Nov 2025, https://www.youtube.com/watch?v=ccsk4uAyFLM). Stills from it are in
the project's shared folder under `reference/campus-tour/`. What the footage shows is modelled;
what it doesn't show is a guess and is marked so.

| File | What it is |
| --- | --- |
| `campus-sketchup-export.json` | Triangles, materials and planting instances exported from the SketchUp model (inches, Z up). |
| `campus-sketchup-view.png` | SketchUp's own render of that model. |
| `campus-vs-tour.png` | The drone shot from the tour next to the same view of the model. |
| `campus-to-glb.mjs` | Turns the export into `src/assets/3d/campus.glb` (metres, Y up, quantised). |

## What is from the video and what is estimated

From the footage:
- One-storey main building under a large green-grey metal roof.
- Front: a portico with two white columns and the dark green "RADIANT INSTITUTE OF PROFESSIONAL
  STUDIES / EMPOWERING YOU TO THRIVE" sign, a white dome behind it, red-brick bays with one square
  window each side, white pavilions with arched door hoods, and arcaded wings.
- A paved forecourt with darker paver bands and tiered topiary along the front.
- A separate white Admission Office with navy stripes, a glass front and solar panels on the roof.
- Labs, classrooms, a computer lab, a library and a student lounge inside.

Estimated or unknown:
- All sizes. The portico is taken as about 10 m wide and the rest is scaled from the drone shot.
  The plot is 90 m × 67 m, about the 12 kanal the video description gives.
- Where the Admission Office stands on the plot (shown front-left).
- Which room is where inside the main building. The interior hotspots sit on the roof and say
  "[TO CONFIRM]".
- The trees and the back and sides of the building, which the video doesn't show.

## Rebuild the GLB

SketchUp's cloud connector saves only `.skp`, so the geometry was exported as triangles from the
live model and converted with three.js `GLTFExporter`, then `@gltf-transform` (dedup, prune and
`KHR_mesh_quantization`, which three.js's `GLTFLoader` reads without an extra decoder).

```sh
npm i --no-save three @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions
node docs/3d/campus-to-glb.mjs docs/3d/campus-sketchup-export.json src/assets/3d/campus.glb
```

## Budgets (CR-01 against NFR-PERF-02)

| Asset | Size | Budget |
| --- | --- | --- |
| `campus.glb` | ~246 KB | ≤ ~1 MB compressed; loads only when the visitor opens the explorer |
| `hero-scene.js` (needs three.js, bundled once with the explorer) | ~8 KB source | loaded after first paint, capable devices only |

Hotspots live in `src/assets/3d/campus-hotspots.json`, with `facts_source` naming the video.
