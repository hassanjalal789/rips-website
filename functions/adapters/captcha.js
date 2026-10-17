// Spam-check adapter (ADR-07: invisible CAPTCHA + honeypot + rate limit, proposed).
// The provider is not chosen (OD-06), so release 1 runs with honeypot + rate limit only.
// A provider adapter must expose verify(token, ip) → { ok: boolean } and is called with a 5 s timeout.

export function createCaptcha({ adapter = 'none' } = {}) {
  if (adapter === 'none' || !adapter) return null;
  if (adapter === 'mock-pass') return { verify: async () => ({ ok: true }) };
  if (adapter === 'mock-fail') return { verify: async () => ({ ok: false }) };
  throw new Error(`captcha adapter "${adapter}" is not implemented (OD-06)`);
}
