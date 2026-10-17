# ADR-05: Enquiry handling

| | |
| --- | --- |
| Status | Proposed (option B; A as fallback) — waits for OD-06 and the legal review OD-15 |
| Owner | Developer |
| Source | Doc 07 Q07, Q09, Q20, Q23, ADR register; Doc 08 Q01, Q13, Q20–Q31, endpoint specification; SRS F-02, F-07, G-02, Q-03, Q-07 |

## Context

The enquiry is the only data visitors send (FEAT-003). The SRS needs:

- one-time submission tokens (Q-03);
- a duplicate flag (same mobile and program within 7 days);
- statuses and notes (G-02);
- export, and deletion on request;
- that no unexpected reply is ever reported as success (Q-07).

Options in Doc 07:

- A) A hosted form service.
- B) A small serverless function that writes to an institute Google Sheet and sends email.

## Decision

Option B is proposed, with A as the fallback. The final choice waits for OD-06 (form-and-email service)
and OD-15, the legal review of whether enquiry data may be kept in Google (Doc 07 Q37; Doc 08 Q05).

Built on this branch: `functions/lib/handler.js` implements `POST /api/v1/enquiry` to the Doc 08
specification.

- Limits: body 8 KB or less, 5 requests per hour per device, a 10-second upstream timeout with one
  retry, a 7-day token, and a 7-day duplicate flag.
- Validation: same-origin check, honeypot, and the same field rules in the browser and the function
  (`functions/lib/validate.js`).
- Responses: error codes that the form maps to the SRS F-07 wording (`src/_data/enquiryMessages.json`).
- Formula-looking values are prefixed so the sheet never runs them (`functions/lib/escape.js`).
- Adapters: `functions/adapters/`. Only the mock store and mailer work. `google-sheet.js` is a stub
  that throws `sheet_not_configured`.

## Consequences

- The function has no read operation, so it cannot leak records (Doc 07 Q22; Doc 08 Q20).
- The sheet gives admissions familiar filters, a status dropdown and version history.
- The store sits behind one adapter, so it can become a database later (Doc 07 Q10).
- Review if volume exceeds about 20,000 rows a year, or if function duration exceeds 3 s (Doc 08 Q35).
- Tests: `npm test` covers validation, token reuse, duplicates, rate limit, formula escaping and
  failure paths (Doc 08 Q40).
