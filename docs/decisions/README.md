# Architecture decisions

The nine decisions in the Doc 07 register (Technical Architecture, "Architecture decision register").
Status follows that register. Anything that waits on an open decision (OD-xx, see
[../open-decisions.md](../open-decisions.md)) stays Proposed until the owner decides.

| ADR | Topic | Status | Waits for |
| --- | --- | --- | --- |
| [ADR-01](ADR-01-site-type.md) | Site type: static site + Git-based CMS + one function | Proposed (A) | Director's approval |
| [ADR-02](ADR-02-static-site-generator.md) | Static site generator: Eleventy | Decided by the developer | Update the Doc 07 register |
| [ADR-03](ADR-03-content-editing.md) | Content editing tool | Proposed | OD-05, one-day trial |
| [ADR-04](ADR-04-hosting.md) | Hosting | Proposed | OD-03, OD-12 |
| [ADR-05](ADR-05-enquiry-handling.md) | Enquiry handling: function + Google Sheet | Proposed (B) | OD-06, OD-15 |
| [ADR-06](ADR-06-email.md) | Email | Proposed | OD-04, OD-12 |
| [ADR-07](ADR-07-spam-protection.md) | Spam protection: invisible CAPTCHA + honeypot + rate limit | Proposed | OD-06 (provider) |
| [ADR-08](ADR-08-analytics.md) | Analytics: GA4 or cookieless | Proposed | Director, OD-15 |
| [ADR-09](ADR-09-staff-identity.md) | Staff identity | Proposed | ADR-03 / OD-05 |

Design changes to the public site are change requests, not ADRs: see
[CR-02](../change-requests/CR-02-photo-led-redesign.md), the photo-led redesign, which replaced
[CR-01](../change-requests/CR-01-premium-3d-motion.md) except its headings font.

To record a decision: change the ADR's status and add the owner and date, update this table and the
matching row in `docs/open-decisions.md`, and remove the placeholders the decision unblocks.
