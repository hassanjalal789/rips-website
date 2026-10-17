# ADR-08: Analytics

| | |
| --- | --- |
| Status | Proposed: GA4 as agreed in the PRD and SRS. A cookieless option is to be raised with the Director; consent depends on the legal review OD-15 |
| Owner | Director |
| Source | Doc 07 Q07, Q29, Q37, ADR register; SRS O-08, R-08, O-13 |

## Context

The PRD and SRS state Google Analytics 4. SRS O-08 proposes a cookie banner with Accept and Decline,
and analytics running only after Accept, to be confirmed by legal review. Doc 07 asks for a cookieless
alternative to be raised with the Director: it would need no consent banner. Nothing in the form may
reach analytics (SRS R-08), and events carry names only (Doc 07 Q07).

## Decision

Not made. GA4 stays the agreed option until the Director has weighed the cookieless alternative and
legal review (OD-15) has settled consent.

No analytics script or cookie banner is in this branch.

## Consequences

- If a cookieless tool is chosen, the SRS O-08 cookie banner can be dropped. That must be recorded as a
  change.
- Whatever is added must be counted in the page-weight budget and the content security policy.
- Core Web Vitals and Search Console errors are among the planned metrics (Doc 07 Q29), so a tool must
  be in place before launch.
