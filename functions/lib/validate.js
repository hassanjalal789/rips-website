// Enquiry field rules (SRS F-02, F-03, F-04; Doc 08 Enquiry entity).
// Shared by the browser form and the serverless function, so the rules live in one place.
// The function's result is authoritative (Doc 08 Q12). Messages are not here: the page maps
// each error code to its SRS F-07 wording from src/_data/enquiryMessages.json.

export const QUALIFICATIONS = [
  'Matric/O-level',
  'FSc Pre-Medical',
  'FSc Pre-Engineering',
  'ICS',
  'FA',
  'ICom',
  'A-level',
  'Other',
];

export const NOT_SURE = 'not-sure';
export const OTHER_CITY = 'Other';

// Letters in any script (Urdu included), spaces, full stop, apostrophes and hyphen.
const NAME_RE = /^[\p{L}\p{M} .'’-]+$/u;
const CITY_RE = /^[\p{L}\p{M} ]+$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_RE = /(https?:\/\/|www\.)/gi;

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

// "0300 1234567", "0300-1234567", "+92 300 1234567" → "+923001234567". Returns null if invalid.
export function normaliseMobile(value) {
  const digits = str(value).replace(/[\s-]/g, '');
  if (/^03\d{9}$/.test(digits)) return '+92' + digits.slice(1);
  if (/^\+923\d{9}$/.test(digits)) return digits;
  return null;
}

export function countLinks(text) {
  return (str(text).match(LINK_RE) || []).length;
}

/**
 * Validate one enquiry.
 * @param {object} input raw fields (strings, or booleans/numbers from JSON)
 * @param {{programCodes: string[], cities: string[]}} options active program codes and the city list
 * @returns {{ok: boolean, errors: {field: string, code: string}[], value: object}}
 */
export function validateEnquiry(input, { programCodes = [], cities = [] } = {}) {
  const errors = [];
  const err = (field, code) => errors.push({ field, code });
  const value = {};

  const name = str(input.full_name);
  if (name.length < 3 || name.length > 60) err('full_name', 'full_name_required');
  else if (!NAME_RE.test(name)) err('full_name', 'full_name_chars');
  value.full_name = name;

  const mobile = normaliseMobile(input.mobile);
  if (!mobile) err('mobile', 'mobile_format');
  value.mobile = mobile;

  const email = str(input.email);
  if (email && (email.length > 100 || !EMAIL_RE.test(email))) err('email', 'email_format');
  value.email = email;

  const program = str(input.program_code);
  if (!program || (program !== NOT_SURE && !programCodes.includes(program))) {
    err('program_code', 'program_required');
  }
  value.program_code = program;

  // City: a list value, or "Other" plus 2–40 letters and spaces (SRS F-03, F-04).
  const city = str(input.city);
  if (!city) {
    err('city', 'city_required');
  } else if (city === OTHER_CITY) {
    const other = str(input.city_other);
    if (other.length < 2 || other.length > 40 || !CITY_RE.test(other)) err('city_other', 'city_required');
    value.city = other;
  } else if (cities.length && !cities.includes(city)) {
    // Free text arriving without "Other" is still accepted if it is a plausible city name.
    if (city.length > 40 || !CITY_RE.test(city)) err('city', 'city_required');
    value.city = city;
  } else {
    value.city = city;
  }

  const qualification = str(input.qualification);
  if (qualification && !QUALIFICATIONS.includes(qualification)) err('qualification', 'qualification_invalid');
  value.qualification = qualification;

  const marksRaw = str(input.marks_percent);
  if (marksRaw !== '') {
    const marks = Number(marksRaw);
    if (!/^\d{1,3}(\.\d)?$/.test(marksRaw) || !Number.isFinite(marks) || marks < 0 || marks > 100) {
      err('marks_percent', 'marks_range');
    }
    value.marks_percent = marks;
  } else {
    value.marks_percent = null;
  }

  const message = str(input.message);
  if (message.length > 500) err('message', 'message_length');
  value.message = message;
  // More than 2 links: accepted but marked as possible spam (SRS F-03).
  value.possible_spam = countLinks(message) > 2;

  const consent = input.consent === true || input.consent === 'true' || input.consent === 'on' || input.consent === 'yes';
  if (!consent) err('consent', 'consent_required');
  value.consent = consent;

  // Path only: query strings could carry personal data (Doc 08: no personal data allowed).
  value.source_page = str(input.source_page).split(/[?#]/)[0].slice(0, 200);
  value.campaign = str(input.campaign).slice(0, 100);

  return { ok: errors.length === 0, errors, value };
}
