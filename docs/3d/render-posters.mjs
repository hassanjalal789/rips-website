// Renders the still posters of the Home "students at work" scene (one per camera stop, wide and
// tall crops) into src/assets/img/study/. Devices that don't get the live 3D scene, and visitors
// who ask for reduced motion, see these instead. Dev-only: needs Playwright's Chromium.
//
//   node docs/3d/render-posters.mjs
//
// Re-run it after changing src/scripts/3d/study-scene.js so the posters match the scene.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'src/assets/img/study');
const SIZES = { wide: [1600, 1000], tall: [720, 1400] };
const STOPS = 6;

const page = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}canvas{display:block;width:100vw;height:100vh}</style>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<canvas></canvas><script type="module">
import { mountStudy } from '/src/scripts/3d/study-scene.js';
const canvas = document.querySelector('canvas');
const study = mountStudy(canvas, { reducedMotion: true });
window.poster = (p) => { study.renderAt(p, 1.6); return canvas.toDataURL('image/webp', 0.8); };
window.ready = true;
</script>`;
const types = { '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page); }
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, [width, height]] of Object.entries(SIZES)) {
  const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  tab.on('pageerror', (e) => console.error(e.message));
  await tab.goto(base);
  await tab.waitForFunction(() => window.ready);
  for (let p = 0; p < STOPS; p++) {
    const data = await tab.evaluate((stop) => window.poster(stop), p);
    const file = path.join(OUT, `stop-${p}-${name}.webp`);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    console.log(`${path.relative(ROOT, file)}  ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
  }
  await tab.close();
}
await browser.close();
server.close();
