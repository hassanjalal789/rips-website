// Full-page screenshots of the main pages at phone (360 px) and desktop (1366 px) widths, for design
// review (Doc 06 Q37). Usage: node scripts/screenshots.mjs [outdir] (default reports/screenshots).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer, listen } from './lib/server.mjs';

const out = process.argv[2] || 'reports/screenshots';
const PAGES = ['/', '/programs/', '/programs/pharm-d/', '/admissions/', '/admissions/fees/', '/notices/', '/notices/2026-27-pharm-d-merit-list-1/', '/enquire/', '/contact/', '/thank-you/', '/about/', '/about/affiliation/', '/faculty/', '/news/', '/privacy/', '/404.html'];
fs.mkdirSync(out, { recursive: true });
const server = createServer({ applyHeaders: true });
const port = await listen(server);
const browser = await chromium.launch();
for (const width of [360, 1366]) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 740 : 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const url of PAGES) {
    await page.goto(`http://127.0.0.1:${port}${url}${url === '/' ? '?3d=0' : ''}`, { waitUntil: 'networkidle' });
    const name = (url.replace(/^\/|\/$/g, '').replace(/[/.]/g, '-') || 'home') + `-${width}.png`;
    // The WhatsApp button is pinned to the bottom of the screen; a full-page capture would paint it
    // over the middle of the page, so it is left out of these shots.
    await page.evaluate(() => document.querySelectorAll('.whatsapp-float').forEach((el) => { el.style.display = 'none'; }));
    await page.screenshot({ path: path.join(out, name), fullPage: true });
  }
  await context.close();
}
await browser.close();
server.close();
console.log(`Screenshots: ${PAGES.length * 2} files in ${out}`);
