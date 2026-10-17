# ADR-01: Site type

| | |
| --- | --- |
| Status | Proposed (option A). The Director approves (Doc 07 register) |
| Owner | Developer; Director approves |
| Source | Doc 07 Q01, Q03, Q11, ADR register; SRS B-03, B-08, O-01, P-01, P-03; Doc 08 Q01–Q02 |

## Context

Visitors mostly read content (SRS B-03) and send one form, the enquiry (FEAT-003). Staff must publish
without a developer (FEAT-006). The old WordPress site was compromised (SRS O-01), the budget is low and
one developer maintains the site (SRS B-08). Traffic is modest: 100–300 visits a day, up to 3,000 at
admission peaks (SRS P-01). Pages must be fast on mobile data (SRS P-03).

Options compared in Doc 07:

- A) Static site built from content files, a Git-based CMS for staff, and external form handling.
- B) Hardened WordPress on managed hosting.
- C) Custom application with a database.

## Decision

Option A, as proposed in Doc 07 Q03: a static site built from content files, edited through a Git-based
CMS (ADR-03), with one serverless function for enquiries (ADR-05). The website owns no database
(Doc 08 Q02): content is files in Git, enquiries live in an institute-owned Google Sheet.

This branch builds option A: `src/` is turned into plain HTML in `_site/`, and `functions/` holds the
one enquiry endpoint, `POST /api/v1/enquiry`.

## Consequences

- No server or database to patch; there is little to hack, and reading always works even when the
  form or editing fails (Doc 07 Q09, Q28).
- Enquiry tracking lives outside the site, in the sheet.
- Date-driven content (intake badges, notice archiving) needs a daily rebuild (Doc 07 Q08).
- Pages, fees and notices change only through a commit, so Git history is the audit trail (Doc 08 Q11).

Review trigger: logged-in student features (phase 3) being approved (Doc 07 register).
