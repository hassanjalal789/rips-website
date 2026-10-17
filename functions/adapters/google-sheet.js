// Google Sheet enquiry store (ADR-05, proposed). NOT IMPLEMENTED YET.
//
// Blocked by OD-06 (form handling sign-off) and OD-15 (legal review: may enquiry data sit in Google?).
// Contract the real adapter must keep (same as mock-store.js):
//   findRecent({ token, mobile, programCode, now, tokenDays, duplicateDays })
//     → { tokenUsed: boolean, duplicate: boolean }   reads recent rows only
//   appendEnquiry(row) → { enquiryId: 'ENQ-YYYY-nnnnnn' }
// Rules: write by column name, new columns only at the right edge (Doc 08 Q36);
// use valueInputOption=RAW; the service account can reach this one sheet only (Doc 08 Q20).
// Credentials come from GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY.

export function createGoogleSheetStore() {
  const notReady = async () => {
    throw new Error('sheet_not_configured');
  };
  return { findRecent: notReady, appendEnquiry: notReady };
}
