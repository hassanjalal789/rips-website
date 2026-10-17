// Contract tests for POST /api/v1/enquiry (Doc 08 Q40; Doc 07 Q31). Fictional data only (Doc 08 Q17).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEnquiry, pakistanTime } from '../functions/lib/handler.js';
import { createMockStore } from '../functions/adapters/mock-store.js';
import { createMockMailer } from '../functions/adapters/mock-mailer.js';
import { createMemoryRateLimiter } from '../functions/adapters/memory-rate-limiter.js';

const ORIGIN = 'https://rips.edu.pk';
const NOW = new Date('2026-10-17T09:30:00Z');

function makeDeps(overrides = {}) {
  const logs = [];
  return {
    store: createMockStore(),
    mailer: createMockMailer(),
    captcha: null,
    rateLimiter: createMemoryRateLimiter(),
    programCodes: ['pharm-d', 'dpt', 'nursing'],
    cities: ['Sheikhupura', 'Lahore', 'Other'],
    allowedOrigins: [ORIGIN],
    now: () => NOW,
    timeoutMs: 200,
    logger: { info: (e) => logs.push(e) },
    logs,
    ...overrides,
  };
}

let tokenSeq = 0;
function valid(extra = {}) {
  tokenSeq += 1;
  return {
    full_name: 'Test Student One',
    mobile: '0300 0000001',
    email: 'test1@example.com',
    program_code: 'pharm-d',
    city: 'Sheikhupura',
    qualification: 'FSc Pre-Medical',
    marks_percent: 78.5,
    message: 'When do classes start?',
    consent: true,
    submission_token: `test-token-${String(tokenSeq).padStart(8, '0')}`,
    website: '',
    source_page: '/programs/pharm-d/',
    ...extra,
  };
}

function req(body, { method = 'POST', origin = ORIGIN, type = 'application/json', ip = '10.0.0.1' } = {}) {
  const headers = { 'content-type': type };
  if (origin) headers.origin = origin;
  return { method, headers, body: typeof body === 'string' ? body : JSON.stringify(body), ip };
}

const parse = (res) => JSON.parse(res.body);

test('valid enquiry returns 201 and stores one New row with normalised mobile', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 201);
  assert.deepEqual(parse(res), { status: 'received' });
  assert.equal(deps.store.rows.length, 1);
  const row = deps.store.rows[0];
  assert.equal(row.status, 'New');
  assert.equal(row.mobile, '+923000000001');
  assert.equal(row.possible_duplicate, 'no');
  assert.match(row.enquiry_id, /^ENQ-2026-\d{6}$/);
  assert.equal(row.received_at, '2026-10-17T14:30:00+05:00');
  assert.deepEqual(deps.mailer.sent.map((m) => m.kind), ['admissions', 'auto_reply']);
});

test('no auto-reply when no email is given', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ email: '' })), deps);
  assert.equal(res.status, 201);
  assert.deepEqual(deps.mailer.sent.map((m) => m.kind), ['admissions']);
});

test('"not-sure" is accepted as a program', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ program_code: 'not-sure' })), deps);
  assert.equal(res.status, 201);
});

const invalidCases = [
  ['empty name', { full_name: '' }, 'full_name', 'full_name_required'],
  ['short name', { full_name: 'Al' }, 'full_name', 'full_name_required'],
  ['name with digits', { full_name: 'Test 123' }, 'full_name', 'full_name_chars'],
  ['bad mobile', { mobile: '12345' }, 'mobile', 'mobile_format'],
  ['mobile without 3', { mobile: '0400 0000001' }, 'mobile', 'mobile_format'],
  ['bad email', { email: 'name@' }, 'email', 'email_format'],
  ['unknown program', { program_code: 'mbbs' }, 'program_code', 'program_required'],
  ['no program', { program_code: '' }, 'program_code', 'program_required'],
  ['no city', { city: '' }, 'city', 'city_required'],
  ['Other city without text', { city: 'Other', city_other: '' }, 'city_other', 'city_required'],
  ['marks over 100', { marks_percent: 101 }, 'marks_percent', 'marks_range'],
  ['marks two decimals', { marks_percent: '78.55' }, 'marks_percent', 'marks_range'],
  ['long message', { message: 'a'.repeat(501) }, 'message', 'message_length'],
  ['no consent', { consent: false }, 'consent', 'consent_required'],
];

for (const [name, patch, field, code] of invalidCases) {
  test(`400 validation_failed: ${name}`, async () => {
    const deps = makeDeps();
    const res = await handleEnquiry(req(valid(patch)), deps);
    assert.equal(res.status, 400);
    const body = parse(res);
    assert.equal(body.error, 'validation_failed');
    assert.deepEqual(body.errors, [{ field, code }]);
    assert.equal(deps.store.rows.length, 0);
  });
}

test('Urdu letters are allowed in names', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ full_name: 'علی احمد' })), deps);
  assert.equal(res.status, 201);
});

test('+92 mobile format is accepted', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ mobile: '+92 300-0000002' })), deps);
  assert.equal(res.status, 201);
  assert.equal(deps.store.rows[0].mobile, '+923000000002');
});

test('same submission token twice: one row, 201 then 200 with the same body', async () => {
  const deps = makeDeps();
  const body = valid();
  const first = await handleEnquiry(req(body), deps);
  const second = await handleEnquiry(req(body), deps);
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.deepEqual(parse(second), parse(first));
  assert.equal(deps.store.rows.length, 1);
});

test('missing or malformed submission token is rejected', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ submission_token: 'short' })), deps);
  assert.equal(res.status, 400);
  assert.equal(parse(res).errors[0].code, 'token_invalid');
});

test('same mobile and program within 7 days is stored but flagged as possible duplicate', async () => {
  const deps = makeDeps();
  await handleEnquiry(req(valid()), deps);
  const res = await handleEnquiry(req(valid({ mobile: '03000000001' })), deps);
  assert.equal(res.status, 201);
  assert.equal(deps.store.rows.length, 2);
  assert.equal(deps.store.rows[1].possible_duplicate, 'yes');
});

test('same mobile, different program is not a duplicate', async () => {
  const deps = makeDeps();
  await handleEnquiry(req(valid()), deps);
  await handleEnquiry(req(valid({ program_code: 'dpt' })), deps);
  assert.equal(deps.store.rows[1].possible_duplicate, 'no');
});

test('same mobile and program after 7 days is not a duplicate', async () => {
  let now = new Date('2026-10-01T09:00:00Z');
  const deps = makeDeps({ now: () => now });
  await handleEnquiry(req(valid()), deps);
  now = new Date('2026-10-09T09:00:00Z');
  await handleEnquiry(req(valid()), deps);
  assert.equal(deps.store.rows[1].possible_duplicate, 'no');
});

test('formula-looking input is stored as plain text', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(
    req(valid({ message: '=SUM(A1:A9)', city: 'Other', city_other: 'Lahore Cantt', full_name: "-O'Brien" })),
    deps,
  );
  assert.equal(res.status, 201);
  const row = deps.store.rows[0];
  assert.equal(row.message, "'=SUM(A1:A9)");
  assert.equal(row.full_name, "'-O'Brien");
  assert.equal(row.city, 'Lahore Cantt');
  for (const v of ['+cmd', '@SUM(1)', '-2+3']) {
    const d = makeDeps();
    await handleEnquiry(req(valid({ message: v })), d);
    assert.equal(d.store.rows[0].message, "'" + v);
  }
});

test('more than 2 links in the message is accepted but marked possible spam', async () => {
  const deps = makeDeps();
  await handleEnquiry(req(valid({ message: 'https://a.example https://b.example www.c.example' })), deps);
  assert.equal(deps.store.rows[0].possible_spam, 'yes');
});

test('honeypot filled returns 403 rejected and stores nothing', async () => {
  const deps = makeDeps();
  const res = await handleEnquiry(req(valid({ website: 'http://spam.example' })), deps);
  assert.equal(res.status, 403);
  assert.deepEqual(parse(res), { error: 'rejected' });
  assert.equal(deps.store.rows.length, 0);
});

test('failed spam check returns 403', async () => {
  const deps = makeDeps({ captcha: { verify: async () => ({ ok: false }) } });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 403);
});

test('spam-check provider down falls back to honeypot + rate limit', async () => {
  const deps = makeDeps({ captcha: { verify: async () => { throw new Error('down'); } } });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 201);
});

test('foreign or missing origin returns 403', async () => {
  const deps = makeDeps();
  assert.equal((await handleEnquiry(req(valid(), { origin: 'https://evil.example' }), deps)).status, 403);
  assert.equal((await handleEnquiry(req(valid(), { origin: null }), deps)).status, 403);
});

test('wrong method returns 405 with Allow header', async () => {
  const res = await handleEnquiry(req('', { method: 'GET' }), makeDeps());
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('wrong content type returns 415', async () => {
  const res = await handleEnquiry(req('full_name=x', { type: 'application/x-www-form-urlencoded' }), makeDeps());
  assert.equal(res.status, 415);
});

test('body over 8 KB returns 413', async () => {
  const res = await handleEnquiry(req(valid({ message: 'x'.repeat(9000) })), makeDeps());
  assert.equal(res.status, 413);
  assert.deepEqual(parse(res), { error: 'too_large' });
});

test('invalid JSON returns 400', async () => {
  const res = await handleEnquiry(req('{not json'), makeDeps());
  assert.equal(res.status, 400);
});

test('sixth request in an hour returns 429 with Retry-After', async () => {
  const deps = makeDeps();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await handleEnquiry(req(valid({ mobile: `0300000000${i}` })), deps)).status, 201);
  }
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 429);
  assert.equal(parse(res).error, 'rate_limited');
  assert.ok(Number(res.headers['retry-after']) > 0);
  // A different device is not affected.
  assert.equal((await handleEnquiry(req(valid(), { ip: '10.0.0.2' }), deps)).status, 201);
});

test('sheet fails once: retried and stored', async () => {
  const deps = makeDeps({ store: createMockStore({ failTimes: 1 }) });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 201);
  assert.equal(deps.store.rows.length, 1);
});

test('sheet down after retry returns 503 and the enquiry reaches admissions by email', async () => {
  const deps = makeDeps({ store: createMockStore({ failTimes: 10 }) });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 503);
  assert.deepEqual(parse(res), { error: 'upstream_unavailable' });
  const admissions = deps.mailer.sent.find((m) => m.kind === 'admissions');
  assert.ok(admissions);
  assert.equal(admissions.meta.stored, false);
  assert.ok(deps.mailer.sent.some((m) => m.kind === 'alert'));
});

test('sheet that never answers times out and returns 503', async () => {
  const hang = { findRecent: () => new Promise(() => {}), appendEnquiry: () => new Promise(() => {}) };
  const deps = makeDeps({ store: hang, timeoutMs: 20 });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 503);
});

test('unexpected sheet reply is treated as failure, never success', async () => {
  const odd = { findRecent: async () => ({ tokenUsed: false, duplicate: false }), appendEnquiry: async () => ({ ok: true }) };
  const deps = makeDeps({ store: odd });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 503);
});

test('email down: enquiry still stored, 201, administrator alert attempted', async () => {
  const deps = makeDeps({ mailer: createMockMailer({ fail: true }) });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 201);
  assert.equal(deps.store.rows.length, 1);
  assert.ok(deps.logs.some((l) => l.outcome === 'email_failed'));
});

test('unexpected error returns 500 internal with no details', async () => {
  const deps = makeDeps({ rateLimiter: { hit: async () => { throw new Error('boom'); } } });
  const res = await handleEnquiry(req(valid()), deps);
  assert.equal(res.status, 500);
  assert.deepEqual(parse(res), { error: 'internal' });
});

test('responses and logs never contain personal data', async () => {
  const deps = makeDeps();
  const responses = [];
  responses.push(await handleEnquiry(req(valid()), deps));
  responses.push(await handleEnquiry(req(valid({ mobile: 'bad' })), deps));
  const text = JSON.stringify(responses.map((r) => r.body)) + JSON.stringify(deps.logs);
  for (const secret of ['Test Student One', '0300', '+92300', 'test1@example.com', 'When do classes', 'test-token']) {
    assert.ok(!text.includes(secret), `leaked ${secret}`);
  }
});

test('query strings are stripped from source_page', async () => {
  const deps = makeDeps();
  await handleEnquiry(req(valid({ source_page: '/enquire/?program=dpt&name=Ali' })), deps);
  assert.equal(deps.store.rows[0].source_page, '/enquire/');
});

test('pakistanTime formats with +05:00', () => {
  assert.equal(pakistanTime(new Date('2026-12-31T20:00:00Z')), '2027-01-01T01:00:00+05:00');
});
