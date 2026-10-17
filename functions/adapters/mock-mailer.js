// Records emails instead of sending them. Used by tests and local development.

export function createMockMailer({ fail = false } = {}) {
  const sent = [];
  const send = (kind) => async (payload, meta) => {
    if (fail) throw new Error('email_unavailable');
    sent.push({ kind, payload, meta });
  };
  return {
    sent,
    sendAdmissions: send('admissions'),
    sendAutoReply: send('auto_reply'),
    sendAlert: send('alert'),
  };
}
