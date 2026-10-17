// POST /api/v1/enquiry: create an enquiry (Doc 08 endpoint specification; SRS FEAT-003, Q-03, Q-07).
// Host-neutral: takes a plain request object and returns a plain response object.
// Platform wrappers in functions/platforms/ translate to and from each host's format.
// Every external service is reached through an adapter passed in `deps`, so the
// Google Sheet, email provider and spam check can be swapped or mocked (Doc 07 Q10).

import { validateEnquiry } from './validate.js';
import { escapeFormula } from './escape.js';

export const MAX_BODY_BYTES = 8 * 1024;
export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
export const TOKEN_TTL_DAYS = 7;
export const DUPLICATE_DAYS = 7;
export const UPSTREAM_TIMEOUT_MS = 10_000;

const SUCCESS = { status: 'received' };

function json(status, body, extraHeaders = {}) {
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Pakistan time with offset, e.g. 2026-10-17T14:30:00+05:00 (Doc 08 Q11).
export function pakistanTime(date) {
  const pkt = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().replace(/\.\d{3}Z$/, '+05:00');
}

export function withTimeout(promise, ms, label = 'upstream') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Call fn, retrying once on failure (Doc 08 Q30). Any thrown error or unexpected reply counts as failure.
async function once(fn, ms, label) {
  try {
    return await withTimeout(fn(), ms, label);
  } catch {
    return await withTimeout(fn(), ms, label);
  }
}

function header(headers, name) {
  if (!headers) return undefined;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

/**
 * @param {{method: string, headers: object, body: string, ip?: string}} req
 * @param {object} deps
 * @param {{appendEnquiry: Function, findRecent: Function}} deps.store enquiry sheet adapter
 * @param {{sendAdmissions: Function, sendAutoReply: Function, sendAlert: Function}} deps.mailer email adapter
 * @param {{verify: Function} | null} deps.captcha spam-check adapter, or null when not configured
 * @param {{hit: Function}} deps.rateLimiter
 * @param {string[]} deps.programCodes active program codes
 * @param {string[]} deps.cities city list
 * @param {string[]} deps.allowedOrigins
 * @param {object} [deps.logger] receives outcome and error type only, never field values (Doc 08 Q21)
 * @param {() => Date} [deps.now]
 * @param {string} [deps.consentVersion]
 * @param {number} [deps.timeoutMs]
 */
export async function handleEnquiry(req, deps) {
  const started = Date.now();
  const log = (outcome, extra = {}) =>
    deps.logger?.info?.({ outcome, duration_ms: Date.now() - started, ...extra });
  const now = deps.now ? deps.now() : new Date();
  const timeoutMs = deps.timeoutMs ?? UPSTREAM_TIMEOUT_MS;

  try {
    if (req.method !== 'POST') {
      log('method_not_allowed');
      return json(405, { error: 'method_not_allowed' }, { allow: 'POST' });
    }

    const type = String(header(req.headers, 'content-type') || '').toLowerCase();
    if (!type.startsWith('application/json')) {
      log('unsupported_media_type');
      return json(415, { error: 'unsupported_media_type' });
    }

    const raw = typeof req.body === 'string' ? req.body : '';
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      log('too_large');
      return json(413, { error: 'too_large' });
    }

    // Same-origin check (Doc 08 Q25). Browsers always send Origin on a cross-origin or POST fetch.
    const origin = header(req.headers, 'origin');
    if (!origin || !deps.allowedOrigins.includes(origin)) {
      log('rejected', { reason: 'origin' });
      return json(403, { error: 'rejected' });
    }

    const ipKey = req.ip || 'unknown';
    const limit = await deps.rateLimiter.hit(ipKey, now);
    if (!limit.allowed) {
      log('rate_limited');
      return json(429, { error: 'rate_limited' }, { 'retry-after': String(limit.retryAfterSeconds) });
    }

    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      log('validation_failed', { reason: 'json' });
      return json(400, { error: 'validation_failed', errors: [] });
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      log('validation_failed', { reason: 'shape' });
      return json(400, { error: 'validation_failed', errors: [] });
    }

    // Honeypot filled: rejected with a generic error, no detail (SRS F-05, Doc 08).
    if (typeof input.website === 'string' && input.website.trim() !== '') {
      log('rejected', { reason: 'honeypot' });
      return json(403, { error: 'rejected' });
    }

    // Spam check. If the provider is down or not configured we fall back to honeypot + rate limit (Doc 07 Q09).
    if (deps.captcha) {
      let verdict;
      try {
        verdict = await withTimeout(deps.captcha.verify(input.captcha_token, ipKey), 5000, 'captcha');
      } catch {
        verdict = { ok: true, degraded: true };
      }
      if (!verdict || verdict.ok !== true) {
        log('rejected', { reason: 'captcha' });
        return json(403, { error: 'rejected' });
      }
    }

    const token = typeof input.submission_token === 'string' ? input.submission_token.trim() : '';
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) {
      log('validation_failed', { reason: 'token' });
      return json(400, { error: 'validation_failed', errors: [{ field: 'submission_token', code: 'token_invalid' }] });
    }

    const result = validateEnquiry(input, { programCodes: deps.programCodes, cities: deps.cities });
    if (!result.ok) {
      log('validation_failed', { fields: result.errors.map((e) => e.code) });
      return json(400, { error: 'validation_failed', errors: result.errors });
    }
    const v = result.value;

    // Token reuse and duplicate check read recent rows only (Doc 08 Q19, Q35).
    let recent;
    try {
      recent = await once(
        () => deps.store.findRecent({ token, mobile: v.mobile, programCode: v.program_code, now, tokenDays: TOKEN_TTL_DAYS, duplicateDays: DUPLICATE_DAYS }),
        timeoutMs,
        'sheet',
      );
      if (!recent || typeof recent.tokenUsed !== 'boolean' || typeof recent.duplicate !== 'boolean') {
        throw new Error('sheet_unexpected_reply');
      }
    } catch (e) {
      return await sheetDown(e, v, deps, now, log);
    }

    if (recent.tokenUsed) {
      // Idempotent repeat: same success body, nothing written (Doc 08 Q28).
      log('repeat_token');
      return json(200, SUCCESS);
    }

    const row = {
      received_at: pakistanTime(now),
      full_name: escapeFormula(v.full_name),
      // Mobile is rebuilt by the function as +923XXXXXXXXX, so it cannot hold a formula.
      mobile: v.mobile,
      email: escapeFormula(v.email),
      program_code: v.program_code,
      city: escapeFormula(v.city),
      qualification: v.qualification,
      marks_percent: v.marks_percent,
      message: escapeFormula(v.message),
      consent: 'yes',
      consent_version: deps.consentVersion || 'v1',
      source_page: escapeFormula(v.source_page),
      campaign: escapeFormula(v.campaign),
      submission_token: token,
      status: 'New',
      possible_duplicate: recent.duplicate ? 'yes' : 'no',
      possible_spam: v.possible_spam ? 'yes' : 'no',
    };

    let saved;
    try {
      saved = await once(() => deps.store.appendEnquiry(row), timeoutMs, 'sheet');
      if (!saved || typeof saved.enquiryId !== 'string' || !/^ENQ-\d{4}-\d{6}$/.test(saved.enquiryId)) {
        throw new Error('sheet_unexpected_reply');
      }
    } catch (e) {
      return await sheetDown(e, v, deps, now, log);
    }

    const enquiry = { ...row, enquiry_id: saved.enquiryId };
    // Email failures never undo a stored enquiry: still 201, administrator alerted (Doc 08 Q31).
    try {
      await once(() => deps.mailer.sendAdmissions(enquiry, { stored: true }), timeoutMs, 'email');
      if (v.email) await once(() => deps.mailer.sendAutoReply(enquiry), timeoutMs, 'email');
    } catch (e) {
      log('email_failed', { enquiry_id: saved.enquiryId, error_type: e.message });
      await deps.mailer.sendAlert?.({ type: 'email_failed', enquiry_id: saved.enquiryId }).catch(() => {});
    }

    log('received', { enquiry_id: saved.enquiryId, possible_duplicate: row.possible_duplicate });
    return json(201, SUCCESS);
  } catch (e) {
    log('internal', { error_type: e?.message });
    await deps.mailer?.sendAlert?.({ type: 'internal' }).catch(() => {});
    return json(500, { error: 'internal' });
  }
}

// Sheet unavailable after retry: 503, enquiry emailed to admissions so it is not lost, admin alerted (Doc 08 Q31).
async function sheetDown(error, v, deps, now, log) {
  log('upstream_unavailable', { error_type: error?.message });
  const enquiry = { ...v, received_at: pakistanTime(now), status: 'New', enquiry_id: '(not stored)' };
  await deps.mailer.sendAdmissions(enquiry, { stored: false }).catch(() => {});
  await deps.mailer.sendAlert?.({ type: 'sheet_unavailable' }).catch(() => {});
  return json(503, { error: 'upstream_unavailable' });
}
