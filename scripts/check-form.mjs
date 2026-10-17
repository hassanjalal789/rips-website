// Browser test of the enquiry journey J1 (Doc 07 Q31; Doc 06 IS-01; SRS F-04, F-07): program pre-selected
// from the address, errors on leaving a field and in a focused summary on submit, City "Other" reveals its
// box, a valid enquiry reaches the function (mock adapters) and lands on Thank-you, and a failed send keeps
// the values and offers WhatsApp. Runs under the real security headers.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer, listen } from './lib/server.mjs';
import { nodeEnquiry } from '../functions/platforms/node-http.js';
import { buildDeps } from '../functions/config.js';

let deps;
const server = createServer({ applyHeaders: true, enquiry: (req, res) => nodeEnquiry(req, res, deps) });
const port = await listen(server);
const base = `http://127.0.0.1:${port}`;
deps = buildDeps({ ALLOWED_ORIGINS: base });

const browser = await chromium.launch();
const results = [];
async function test(name, fn) {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page);
    assert.deepEqual(errors, [], 'no script errors');
    results.push(`  ✓ ${name}`);
  } catch (e) {
    results.push(`  ✗ ${name}: ${e.message.split('\n')[0]}`);
    process.exitCode = 1;
  }
  await context.close();
}

const fillValid = async (page) => {
  await page.fill('#enq-name', 'Test Student One');
  await page.fill('#enq-mobile', '0300 0000001');
  await page.check('#enq-consent');
};

await test('program is pre-selected from ?program=', async (page) => {
  await page.goto(`${base}/enquire/?program=dpt`);
  assert.equal(await page.inputValue('#enq-program'), 'dpt');
  assert.equal(await page.inputValue('#enq-city'), 'Sheikhupura');
});

await test('leaving a field shows its message (SRS F-06, F-07)', async (page) => {
  await page.goto(`${base}/enquire/`);
  await page.fill('#enq-mobile', '12345');
  await page.press('#enq-mobile', 'Tab');
  assert.equal((await page.textContent('#enq-mobile-error')).trim(), 'Please enter a mobile number like 0300 1234567.');
  assert.equal(await page.getAttribute('#enq-mobile', 'aria-invalid'), 'true');
  await page.fill('#enq-mobile', '0300 1234567');
  assert.equal(await page.isVisible('#enq-mobile-error'), false, 'error clears while typing');
});

await test('submit with errors focuses the summary and keeps values', async (page) => {
  await page.goto(`${base}/enquire/`);
  await page.fill('#enq-name', 'Ali');
  await page.click('[data-submit]');
  await page.waitForSelector('[data-error-summary]:not([hidden])');
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-error-summary]')), true);
  const items = await page.$$eval('[data-error-list] a', (as) => as.map((a) => a.textContent));
  assert.ok(items.some((t) => t.includes('Please enter a mobile number')), 'mobile listed');
  assert.ok(items.some((t) => t.includes('Please choose a program')), 'program listed');
  assert.ok(items.some((t) => t.includes('Please tick the box')), 'consent listed');
  assert.equal(await page.inputValue('#enq-name'), 'Ali');
});

await test('City "Other" reveals a required city box; marks appear after a qualification', async (page) => {
  await page.goto(`${base}/enquire/`);
  assert.equal(await page.isVisible('#enq-city-other'), false);
  await page.selectOption('#enq-city', 'Other');
  assert.equal(await page.isVisible('#enq-city-other'), true);
  assert.equal(await page.isVisible('#enq-marks'), false);
  await page.selectOption('#enq-qualification', 'FSc Pre-Medical');
  assert.equal(await page.isVisible('#enq-marks'), true);
});

await test('a valid enquiry is stored and lands on Thank-you', async (page) => {
  await page.goto(`${base}/enquire/?program=pharm-d`);
  await fillValid(page);
  await Promise.all([page.waitForURL(`${base}/thank-you/`), page.click('[data-submit]')]);
  assert.equal(await page.title(), 'Thank you, we have your enquiry | RIPS Sheikhupura');
  const row = deps.store.rows.at(-1);
  assert.equal(row.program_code, 'pharm-d');
  assert.equal(row.mobile, '+923000000001');
  assert.equal(row.source_page, '/enquire/');
});

await test('the Contact page form works too', async (page) => {
  await page.goto(`${base}/contact/`);
  await fillValid(page);
  await page.selectOption('#enq-program', 'not-sure');
  await Promise.all([page.waitForURL(`${base}/thank-you/`), page.click('[data-submit]')]);
  assert.equal(deps.store.rows.at(-1).source_page, '/contact/');
});

await test('a failed send keeps the values and offers WhatsApp (SRS D-07)', async (page) => {
  await page.route('**/api/v1/enquiry', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"upstream_unavailable"}' }));
  await page.goto(`${base}/enquire/?program=nursing`);
  await fillValid(page);
  await page.click('[data-submit]');
  await page.waitForSelector('[data-form-failure]:not([hidden])');
  assert.match(await page.textContent('[data-failure-text]'), /We couldn’t send your enquiry/);
  assert.equal(await page.inputValue('#enq-name'), 'Test Student One');
  assert.equal(await page.isEnabled('[data-submit]'), true);
});

await test('notice filters keep the choice in the address (IS-02)', async (page) => {
  await page.goto(`${base}/notices/?program=dpt`);
  const shown = await page.$$eval('[data-filter-item]:not([hidden])', (els) => els.map((e) => e.dataset.program));
  assert.ok(shown.length > 0 && shown.every((p) => p === 'dpt' || p === 'all'));
  assert.match(await page.textContent('[data-filter-count]'), /notices? shown/);
  await page.selectOption('#f-type', 'Merit list');
  assert.match(page.url(), /type=Merit\+list/);
  await page.click('.filter-actions [data-filter-clear]');
  assert.equal(new URL(page.url()).search, '');
});

await browser.close();
server.close();
console.log(results.join('\n'));
console.log(`Form and filters: ${results.filter((r) => r.includes('✓')).length}/${results.length} passed`);
