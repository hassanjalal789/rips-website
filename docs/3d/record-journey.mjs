// Records the Home page's 3D journey frame by frame (smooth on any machine, even without a GPU)
// and writes an MP4 and a short GIF with ffmpeg. Dev-only: needs Playwright's Chromium and ffmpeg,
// and the built site served locally (e.g. `npx eleventy --serve`).
//
//   node docs/3d/record-journey.mjs http://localhost:8080/ out/journey-desktop 1280 720
//
// The page runs in capture mode (?capture&3d=1): no smooth-scroll library and no reveal
// animations, and the scene is rendered at exact times so the video matches real playback.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const [base, outPrefix, w = '1280', h = '720', fps = '24'] = process.argv.slice(2);
if (!base || !outPrefix) throw new Error('Usage: node record-journey.mjs <site url> <out prefix> [width] [height] [fps]');
const FPS = +fps;
const frames = `${outPrefix}-frames`;
fs.rmSync(frames, { recursive: true, force: true });
fs.mkdirSync(frames, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(new URL('?capture&3d=1', base).href, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__study, null, { timeout: 60000 });
const { stops, range } = await page.evaluate(() => {
  const journey = document.querySelector('[data-journey]');
  const top = journey.getBoundingClientRect().top + scrollY;
  const chapters = [...document.querySelectorAll('.chapter')].map((c) => c.getBoundingClientRect().top + scrollY);
  const after = document.querySelector('.journey + *').getBoundingClientRect().top + scrollY;
  return { stops: [top, ...chapters, after], range: journey.offsetHeight - innerHeight };
});

// Hold on each stop, then glide to the next (ease in-out), ending on the program cards.
const HOLD = 1.8, MOVE = 1.2;
const timeline = [];
let t = 0;
stops.forEach((y, i) => {
  timeline.push({ t, y }); t += i === 0 ? 2.4 : HOLD;
  timeline.push({ t, y }); t += MOVE;
});
const total = t - MOVE;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const scrollAt = (time) => {
  for (let i = 0; i < timeline.length - 1; i++) {
    const a = timeline[i], b = timeline[i + 1];
    if (time <= b.t) return a.y + (b.y - a.y) * ease((time - a.t) / Math.max(1e-6, b.t - a.t));
  }
  return timeline.at(-1).y;
};

const count = Math.round(total * FPS);
for (let f = 0; f < count; f++) {
  const time = f / FPS;
  const y = scrollAt(time);
  await page.evaluate(([scroll, p, tt]) => { window.scrollTo(0, scroll); window.__study.renderAt(p, tt); }, [y, Math.min(5, Math.max(0, (y - stops[0]) / range * 5)), 1 + time]);
  await page.screenshot({ path: path.join(frames, `${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
}
await browser.close();

const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
ff(['-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'slow', '-movflags', '+faststart', `${outPrefix}.mp4`]);
// GIF: the hero and the first two chapters, smaller and at 12 fps.
const gifWidth = Math.min(640, +w);
ff(['-t', String(2.4 + 2 * (HOLD + MOVE) + MOVE), '-i', `${outPrefix}.mp4`, '-vf', `fps=12,scale=${gifWidth}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, `${outPrefix}.gif`]);
fs.rmSync(frames, { recursive: true, force: true });
for (const ext of ['mp4', 'gif']) console.log(`${outPrefix}.${ext}  ${(fs.statSync(`${outPrefix}.${ext}`).size / 1024 / 1024).toFixed(2)} MB`);
