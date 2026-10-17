// Email adapter (ADR-06). NOT IMPLEMENTED YET: provider is Not Decided (OD-04).
// Contract (same as mock-mailer.js):
//   sendAdmissions(enquiry, { stored })  details to the admissions mailbox; values HTML-escaped
//   sendAutoReply(enquiry)              only when the visitor gave an email
//   sendAlert({ type, enquiry_id? })    to the administrator; no personal data
// Use escapeHtml() from ../lib/escape.js for every value placed in an email body.

export function createEmailAdapter() {
  const notReady = async () => {
    throw new Error('email_not_configured');
  };
  return { sendAdmissions: notReady, sendAutoReply: notReady, sendAlert: notReady };
}
