// Spreadsheet formula escaping (Doc 07 Q23, Doc 08 Q40): a value that starts with
// = + - @ (or a tab / carriage return, which some apps strip before parsing) is
// prefixed with an apostrophe so the sheet stores it as plain text and never runs it.
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeFormula(value) {
  if (typeof value !== 'string') return value;
  return FORMULA_START.test(value) ? "'" + value : value;
}

// HTML escaping for values placed in notification emails (Doc 07 Q23).
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
