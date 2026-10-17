# ADR-04: Hosting

| | |
| --- | --- |
| Status | Proposed — waits for OD-03 (and budget OD-12) |
| Owner | Director with developer |
| Source | Doc 07 Q12, Q13, Q15, Q27, Q37, ADR register; SRS S-01–S-03, S-07, P-06; OD-16 |

## Context

The host must provide:

- HTTPS and security headers;
- preview builds and a password-protected staging site (SRS S-01, S-02; OD-16);
- instant rollback (SRS S-07);
- serverless functions for the enquiry endpoint;
- good speed in Pakistan;
- 99.5% availability (SRS P-06).

Doc 07 compares static hosts with a global CDN and free tiers (for example Cloudflare Pages, Netlify and
Vercel) against shared hosting. It asks not to preselect a vendor without evidence: check plan limits,
function support and edge presence in Pakistan.

## Decision

Not made. OD-03 (new hosting provider: Director with developer, before development) is open. Nothing
is deployed.

Meanwhile the build stays host-neutral:

- `_site/` is plain files.
- The enquiry function core (`functions/lib/handler.js`) takes a plain request and returns a plain
  response. `functions/platforms/fetch.js` wraps it for hosts whose functions take a Fetch API
  `Request`; `functions/platforms/node-http.js` is for local development.
- Security and cache headers (Doc 07 Q24, Q27) are kept in one headers file in the repo, so they can be
  moved to the chosen host.

## Consequences

- Moving host means re-pointing DNS and re-entering environment settings, not rebuilding (Doc 07 Q10).
- The in-memory rate limiter (`functions/adapters/memory-rate-limiter.js`) is per function instance.
  It must be swapped for the host's shared store once OD-03 is decided.
- Staging address (OD-16), DNS steps (Doc 07 Q15) and rollback rehearsal (Doc 07 Q38) all wait for this
  decision.
