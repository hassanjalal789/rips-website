// Accessibility check (SRS N-03, T-04; Doc 06 Q37): axe-core (WCAG 2.0/2.1 A and AA plus best practice)
// on every built page at phone and desktop sizes, served with the real security headers, so a script or
// style the content security policy blocks also fails here. Home is also checked with reduced motion.
import fs from 'node:fs';
import { chromium } from 'playwright';
import { builtPages, createServer, listen } from './lib/server.mjs';

const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const server = createServer({ applyHeaders: true });
const port = await listen(server);
const base = `http://127.0.0.1:${port}`;

const runs = [];
for (const [url] of builtPages()) {
  runs.push({ url, viewport: { width: 360, height: 740 } });
  runs.push({ url, viewport: { width: 1366, height: 800 } });
}
runs.push({ url: '/', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
runs.push({ url: '/enquire/?program=dpt', viewport: { width: 360, height: 740 } });

const browser = await chromium.launch();
let failures = 0;
for (const run of runs) {
  const context = await browser.newContext({ viewport: run.viewport, reducedMotion: run.reducedMotion ?? 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + run.url, { waitUntil: 'load' });
  // Let entrance animations finish so contrast is measured on the final colours.
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(200);
  await page.evaluate(AXE);
  const result = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
  const expected404 = run.url === '/404.html';
  const realErrors = errors.filter((e) => !(expected404 && /404/.test(e)));
  const label = `${run.url} @${run.viewport.width}${run.reducedMotion ? ' reduced-motion' : ''}`;
  if (result.violations.length || realErrors.length) {
    failures++;
    console.log(`  ✗ ${label}`);
    for (const v of result.violations) console.log(`      ${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    for (const e of realErrors) console.log(`      console: ${e}`);
  }
  await context.close();
}
await browser.close();
server.close();
console.log(`Accessibility: ${runs.length} page views, ${failures} with problems`);
process.exitCode = failures ? 1 : 0;
