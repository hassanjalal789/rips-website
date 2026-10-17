// In-memory enquiry store with the same contract as the Google Sheet adapter.
// Used by tests and local development. Never used in production.

export function createMockStore({ failTimes = 0 } = {}) {
  const rows = [];
  let failuresLeft = failTimes;
  const maybeFail = () => {
    if (failuresLeft > 0) {
      failuresLeft -= 1;
      throw new Error('sheet_unavailable');
    }
  };
  return {
    rows,
    async findRecent({ token, mobile, programCode, now, tokenDays, duplicateDays }) {
      maybeFail();
      const day = 24 * 60 * 60 * 1000;
      const t = now.getTime();
      const within = (row, days) => t - row._receivedMs <= days * day;
      return {
        tokenUsed: rows.some((r) => r.submission_token === token && within(r, tokenDays)),
        duplicate: rows.some((r) => r.mobile === mobile && r.program_code === programCode && within(r, duplicateDays)),
      };
    },
    async appendEnquiry(row) {
      maybeFail();
      const year = row.received_at.slice(0, 4);
      const enquiryId = `ENQ-${year}-${String(rows.length + 1).padStart(6, '0')}`;
      rows.push({ ...row, enquiry_id: enquiryId, _receivedMs: Date.parse(row.received_at) });
      return { enquiryId };
    },
  };
}
