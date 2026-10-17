# ADR-09: Staff identity

| | |
| --- | --- |
| Status | Proposed — depends on ADR-03 (OD-05) |
| Owner | Developer |
| Source | Doc 07 Q21, Q22, Q24, ADR register; SRS C-08, C-09, O-02, O-06; Doc 08 Q19 |

## Context

Staff edit content (admissions officer, content editor, administrator) and handle enquiries. Visitors
have no accounts. The site itself stores no staff users (Doc 08 Q06).

## Decision

Proposed in Doc 07:

- Staff sign in to the CMS through its Git provider, with two-factor enforced for the institute's
  organisation.
- They sign in to the enquiry sheet with Google accounts, with 2-step verification.
- Authorisation lives in those services: repository permissions plus the CMS review workflow for
  content, and sheet sharing for enquiries (Doc 07 Q22).

This waits for the editing tool, ADR-03 / OD-05. The exact SRS C-08/C-09 session behaviour is
confirmed in the ADR-03 trial.

## Consequences

- Staff need accounts on those services.
- Offboarding removes access in both.
- Administrative access is reviewed every quarter (Doc 07 Q24).
- Nothing protected is served by the static host, so the website code holds no sign-in, sessions or
  passwords.
