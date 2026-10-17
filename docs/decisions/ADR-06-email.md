# ADR-06: Email

| | |
| --- | --- |
| Status | Proposed — waits for OD-04 (and budget OD-12) |
| Owner | Director with developer |
| Source | Doc 07 Q15, Q37, ADR register; SRS S-04; Doc 08 Q21, Q30, Q31; PVS Q58 |

## Context

Admissions needs a mailbox that receives enquiries. The site needs to send:

- the admissions notification;
- the auto-reply to visitors who gave an email;
- alerts to the administrator.

The SRS proposes admissions@, no-reply@ and webmaster@rips.edu.pk addresses (SRS S-04). Existing
institute email may run on the old host, so its MX records must be recorded before any DNS change
(PVS Q58; Doc 07 Q04, Q15).

Options in Doc 07:

- For mailboxes: Google Workspace, Zoho Mail, or the host's email.
- For auto-replies: a transactional email service, or the mailbox provider.

## Decision

Not made. OD-04 (email provider and how MX records move: Director with developer, before the DNS
switch) is open.

Meanwhile:

- `functions/adapters/email.js` documents the contract (`sendAdmissions`, `sendAutoReply`,
  `sendAlert`) and throws `email_not_configured`.
- `functions/adapters/mock-mailer.js` is used in development and tests.
- Every value placed in an email body is HTML-escaped (`functions/lib/escape.js`).
- The site shows `[TO CONFIRM — admissions email, OD-04]` wherever the address would appear.

## Consequences

- SPF, DKIM and DMARC are required, so that mail doesn't land in spam.
- If email fails, the enquiry is still stored and the administrator is alerted (Doc 08 Q31).
- If the sheet fails, the enquiry is emailed to admissions so it is not lost.
- Sending limits of the chosen plan go on the quota watch (Doc 08 Q30).
