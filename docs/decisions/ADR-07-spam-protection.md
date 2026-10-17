# ADR-07: Spam protection

| | |
| --- | --- |
| Status | Proposed: invisible CAPTCHA + honeypot + rate limit. The provider waits for OD-06 |
| Owner | Developer |
| Source | Doc 07 Q09, Q23, ADR register; Doc 08 Q25, Q27, Q30, Q40; SRS O-03 |

## Context

The enquiry form must resist bots without hurting keyboard or screen-reader users. Options in Doc 07:

- an invisible CAPTCHA (for example Cloudflare Turnstile or hCaptcha);
- Google reCAPTCHA;
- a honeypot only.

## Decision

Proposed: an invisible CAPTCHA, a honeypot and a rate limit of 5 requests per hour per device (Doc 07
Q23). The CAPTCHA provider is not chosen. It belongs with the form-handling decision, OD-06.

Meanwhile release 1 runs with the honeypot and the rate limit only:

- `functions/adapters/captcha.js` returns no checker when `CAPTCHA_ADAPTER=none`. Mock pass and fail
  adapters exist for tests.
- A real provider adapter must expose `verify(token, ip)` and is called with a 5-second timeout.

## Consequences

- If the spam check is down, the form falls back to the honeypot and rate limit (Doc 07 Q09; Doc 08
  Q30).
- A filled honeypot or a bad spam token returns 403 (Doc 08 Q40).
- Whatever provider is chosen must stay keyboard and screen-reader friendly (Doc 07 register).
