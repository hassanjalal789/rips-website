// Page weight budget (NFR-PERF-02, SRS P-03: about 1.5 MB or less on first load). Loads every page at
// phone and desktop size with no interaction and adds up every response body, uncompressed, as a host
// without compression would send it.
import { chromium } from 'playwright';
import { builtPages, createServer, listen } from './lib/server.mjs';

const BUDGET = 1.5 * 1024 * 1024;
const server = createServer();
const port = await listen(server);
const base = `http://127.0.0.1:${port}`;
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const browser = await chromium.launch();
async function weigh(url, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  let total = 0;
  const pending = [];
  page.on('response', (r) => pending.push(r.body().then((b) => (total += b.length)).catch(() => {})));
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await Promise.all(pending);
  await context.close();
  return total;
}

let over = 0;
const rows = [];
for (const [url] of builtPages()) {
  const phone = await weigh(url, { width: 390, height: 844 });
  const desktop = await weigh(url, { width: 1366, height: 800 });
  const worst = Math.max(phone, desktop);
  if (worst > BUDGET) over++;
  rows.push(`  ${worst > BUDGET ? '✗' : '✓'} ${url.padEnd(48)} phone ${kb(phone).padStart(7)}  desktop ${kb(desktop).padStart(7)}`);
}
await browser.close();
server.close();
console.log(rows.join('\n'));
console.log(`Weight: budget ${kb(BUDGET)} on first load, ${over} page(s) over`);
process.exitCode = over ? 1 : 0;
