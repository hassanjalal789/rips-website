// Business rules and content validation run at build time (SRS E-07; Doc 08 Q12, Q16).
// The site is rebuilt daily so date-based results stay current (Doc 07 Q08).
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DAY = 24 * 60 * 60 * 1000;
export const CLOSING_SOON_DAYS = 7;
export const NOTICE_REMOVE_AFTER_DAYS = 730; // removed from the site 2 years after archiving (Doc 08 Notice)

// Dates in content are Pakistan calendar dates. A date-only value means the whole day in PKT.
function startOfDayPkt(value) {
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return new Date(`${s}T00:00:00+05:00`);
}

/**
 * Intake status badge from dates (SRS E-07):
 * Upcoming before the opening date, Open, Closing soon (7 days or less before the closing date),
 * Closed after the closing date.
 */
export function intakeStatus(intake, today = new Date()) {
  if (!intake || !intake.opens_on || !intake.closes_on) return null;
  const now = today.getTime();
  const opens = startOfDayPkt(intake.opens_on).getTime();
  const closesEnd = startOfDayPkt(intake.closes_on).getTime() + DAY; // open through the closing day
  if (now < opens) return { key: 'upcoming', label: 'Upcoming' };
  if (now >= closesEnd) return { key: 'closed', label: 'Closed' };
  if (closesEnd - now <= CLOSING_SOON_DAYS * DAY) return { key: 'closing-soon', label: 'Closing soon' };
  return { key: 'open', label: 'Open' };
}

/**
 * Where a published notice belongs today: "current" until its archive date, then "archived";
 * "removed" two years after that, when the page says the notice is no longer available (SRS D-06).
 */
export function noticeState(notice, today = new Date()) {
  const archiveOn = startOfDayPkt(notice.archive_on).getTime();
  const now = today.getTime();
  if (now < archiveOn) return 'current';
  if (now < archiveOn + NOTICE_REMOVE_AFTER_DAYS * DAY) return 'archived';
  return 'removed';
}

export function readFrontMatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? yaml.load(m[1]) || {} : {};
}

const PROGRAM_FIELDS = ['Pharmacy', 'Physical therapy', 'Nursing', 'Allied health', 'Sciences', 'Computing', 'Business', 'Media', 'English'];
const PROGRAM_LEVELS = ['Intermediate', 'Undergraduate', 'Postgraduate', 'Short course'];
const PROGRAM_STATUS = ['Active', 'Not offered this intake', 'Withdrawn'];
const NOTICE_TYPES = ['Admission', 'Merit list', 'Exam', 'General'];
const CONTENT_STATUS = ['Draft', 'In review', 'Published', 'Archived'];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SESSION_RE = /^\d{4}[–-]\d{2}$/;

/**
 * Validate the content files. Throws with every problem listed, so the build fails (Doc 08 Q12).
 * @param {string} root the Eleventy input folder
 */
export function validateContent(root) {
  const problems = [];
  const files = (dir) =>
    fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.md')).map((f) => path.join(root, dir, f)) : [];

  const programs = files('content/programs').map((f) => ({ file: f, ...readFrontMatter(f) }));
  const slugs = new Set();
  for (const p of programs) {
    const where = path.basename(p.file);
    for (const key of ['slug', 'title', 'short', 'field', 'level', 'status']) if (!p[key]) problems.push(`${where}: missing ${key}`);
    if (p.slug && !SLUG_RE.test(p.slug)) problems.push(`${where}: slug must be lowercase-hyphen`);
    if (p.slug && slugs.has(p.slug)) problems.push(`${where}: duplicate program code ${p.slug}`);
    slugs.add(p.slug);
    if (p.field && !PROGRAM_FIELDS.includes(p.field)) problems.push(`${where}: unknown field ${p.field}`);
    if (p.level && !PROGRAM_LEVELS.includes(p.level)) problems.push(`${where}: unknown level ${p.level}`);
    if (p.status && !PROGRAM_STATUS.includes(p.status)) problems.push(`${where}: unknown status ${p.status}`);
    if (p.fee_per_year_pkr != null && !(Number.isInteger(p.fee_per_year_pkr) && p.fee_per_year_pkr >= 0)) {
      problems.push(`${where}: fee_per_year_pkr must be a whole number ≥ 0`);
    }
  }

  const notices = files('content/notices').map((f) => ({ file: f, ...readFrontMatter(f) }));
  const meritKeys = new Set();
  const noticeSlugs = new Set();
  for (const n of notices) {
    const where = path.basename(n.file);
    for (const key of ['slug', 'title', 'type', 'program', 'publish_at', 'archive_on', 'file', 'status']) if (!n[key]) problems.push(`${where}: missing ${key}`);
    if (n.slug && !SLUG_RE.test(n.slug)) problems.push(`${where}: slug must be lowercase-hyphen`);
    if (n.slug && noticeSlugs.has(n.slug)) problems.push(`${where}: duplicate notice slug ${n.slug}`);
    noticeSlugs.add(n.slug);
    if (n.title && (n.title.length < 5 || n.title.length > 120)) problems.push(`${where}: title must be 5–120 characters`);
    if (n.type && !NOTICE_TYPES.includes(n.type)) problems.push(`${where}: unknown type ${n.type}`);
    if (n.status && !CONTENT_STATUS.includes(n.status)) problems.push(`${where}: unknown status ${n.status}`);
    if (n.program && n.program !== 'all' && !slugs.has(n.program)) problems.push(`${where}: unknown program code ${n.program}`);
    if (n.publish_at && n.archive_on && startOfDayPkt(n.archive_on) < startOfDayPkt(n.publish_at)) {
      problems.push(`${where}: archive_on is earlier than publish_at (SRS F-05)`);
    }
    if (n.file && !/\.pdf$/i.test(n.file)) problems.push(`${where}: file must be a PDF`);
    if (n.file && !fs.existsSync(path.join(root, n.file))) problems.push(`${where}: file ${n.file} not found`);
    if (n.file && fs.existsSync(path.join(root, n.file)) && fs.statSync(path.join(root, n.file)).size > 5 * 1024 * 1024) {
      problems.push(`${where}: file is over 5 MB (SRS F-09)`);
    }
    if (n.type === 'Merit list') {
      if (!n.session || !SESSION_RE.test(n.session)) problems.push(`${where}: merit list needs a session like 2026–27`);
      if (!n.approved_by) problems.push(`${where}: merit list needs approved_by`);
      if (n.file && !n.file.startsWith('/files/merit-lists/')) problems.push(`${where}: merit-list PDFs go in /files/merit-lists/ (no-index header)`);
      const key = `${n.program}|${n.session}|${n.number}`;
      if (meritKeys.has(key)) problems.push(`${where}: a merit list with the same program, session and number exists`);
      meritKeys.add(key);
    }
  }

  const news = files('content/news').map((f) => ({ file: f, ...readFrontMatter(f) }));
  for (const n of news) {
    const where = path.basename(n.file);
    for (const key of ['slug', 'title', 'date', 'summary', 'status']) if (!n[key]) problems.push(`${where}: missing ${key}`);
    if (n.program && !slugs.has(n.program)) problems.push(`${where}: unknown program code ${n.program}`);
  }

  const dataFile = (name) => yaml.load(fs.readFileSync(path.join(root, '_data', name), 'utf8'));
  for (const intake of dataFile('intakes.yaml') || []) {
    for (const code of intake.programs || []) if (!slugs.has(code)) problems.push(`intakes.yaml ${intake.session}: unknown program code ${code}`);
  }
  for (const fee of dataFile('fees.yaml') || []) {
    if (!slugs.has(fee.program)) problems.push(`fees.yaml: unknown program code ${fee.program}`);
  }

  if (problems.length) throw new Error(`Content validation failed:\n  - ${problems.join('\n  - ')}`);
  return { programs, notices, news };
}
