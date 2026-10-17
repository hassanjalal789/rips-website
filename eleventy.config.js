// Eleventy configuration (ADR-02). Content model follows Doc 08: programs, notices and news are
// Markdown files with front matter; intakes, fee schedules, faculty and site settings are YAML data.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import * as esbuild from 'esbuild';
import { intakeStatus, noticeState, validateContent } from './lib/content-rules.js';

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension('yaml,yml', (contents) => yaml.load(contents));

  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/files': 'files' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/img/favicon.png': 'favicon.png' });
  eleventyConfig.addWatchTarget('./functions/lib/');
  eleventyConfig.addWatchTarget('./lib/');
  eleventyConfig.addWatchTarget('./src/scripts/');

  // ----- Collections ---------------------------------------------------------------------------
  const byOrder = (a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || a.data.title.localeCompare(b.data.title);
  const newestFirst = (a, b) => new Date(b.data.publish_at) - new Date(a.data.publish_at);

  eleventyConfig.addCollection('programs', (api) =>
    api.getFilteredByGlob('src/content/programs/*.md').sort(byOrder),
  );
  eleventyConfig.addCollection('notices', (api) =>
    api.getFilteredByGlob('src/content/notices/*.md').sort(newestFirst),
  );
  eleventyConfig.addCollection('news', (api) =>
    api.getFilteredByGlob('src/content/news/*.md').sort((a, b) => new Date(b.data.date) - new Date(a.data.date)),
  );

  // ----- Rules (SRS E-07) ----------------------------------------------------------------------
  eleventyConfig.addFilter('intakeStatus', (intake, today) => intakeStatus(intake, today));
  eleventyConfig.addFilter('noticeState', (notice, today) => noticeState(notice, today));
  eleventyConfig.addFilter('currentNotices', (items, today) => items.filter((n) => noticeState(n.data, today) === 'current'));
  eleventyConfig.addFilter('archivedNotices', (items, today) => items.filter((n) => noticeState(n.data, today) === 'archived'));
  eleventyConfig.addFilter('sameProgramSession', (items, program, session, url) =>
    items.filter((n) => n.url !== url && n.data.program === program && n.data.session === session),
  );
  eleventyConfig.addFilter('latestExcept', (items, url, n = 3) => items.filter((i) => i.url !== url).slice(0, n));
  eleventyConfig.addFilter('forProgram', (items, slug) => items.filter((n) => n.data.program === slug || n.data.program === 'all'));
  eleventyConfig.addFilter('activePrograms', (items) => items.filter((p) => p.data.status !== 'Withdrawn'));
  eleventyConfig.addFilter('sameField', (items, program) =>
    items.filter((p) => p.data.field === program.field && p.data.slug !== program.slug && p.data.status !== 'Withdrawn'),
  );
  eleventyConfig.addFilter('programBySlug', (items, slug) => items.find((p) => p.data.slug === slug));
  eleventyConfig.addFilter('intakeFor', (intakes, slug) => intakes.find((i) => (i.programs || []).includes(slug)));
  eleventyConfig.addFilter('feeFor', (fees, slug) => fees.find((f) => f.program === slug));

  // ----- Formatting ----------------------------------------------------------------------------
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const toDate = (v) => (v instanceof Date ? v : new Date(String(v).length === 10 ? `${v}T00:00:00+05:00` : v));
  // Dates shown in Pakistan time, e.g. "17 October 2026" (Doc 08 Q11).
  eleventyConfig.addFilter('displayDate', (value) => {
    if (!value) return '';
    const d = new Date(toDate(value).getTime() + 5 * 3600 * 1000);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter('isoDate', (value) => {
    if (!value) return '';
    const d = new Date(toDate(value).getTime() + 5 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  eleventyConfig.addFilter('fileSize', (url) => {
    const file = path.join('src', url);
    if (!fs.existsSync(file)) throw new Error(`Missing file ${file}`);
    const bytes = fs.statSync(file).size;
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  });
  eleventyConfig.addFilter('pkr', (n) => (n == null ? null : `Rs ${Number(n).toLocaleString('en-PK')}`));
  eleventyConfig.addFilter('cspHash', (code) => `sha256-${crypto.createHash('sha256').update(code).digest('base64')}`);
  eleventyConfig.addFilter('pluck', (items, key) => items.map((i) => key.split('.').reduce((o, k) => o?.[k], i)));
  eleventyConfig.addFilter('json', (v) => JSON.stringify(v).replace(/</g, '\\u003c'));
  eleventyConfig.addFilter('initials', (title) =>
    String(title).split(/[\s(-]+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
  );

  // Visible placeholder for a fact that is not confirmed yet: [TO CONFIRM — what, OD-xx].
  eleventyConfig.addShortcode('tbc', (what, od) => `<span class="tbc">[TO CONFIRM — ${what}${od ? `, ${od}` : ''}]</span>`);
  eleventyConfig.addFilter('tbc', (value, what, od) =>
    value == null || value === '' ? `<span class="tbc">[TO CONFIRM — ${what}${od ? `, ${od}` : ''}]</span>` : value,
  );

  // ----- Build hooks ---------------------------------------------------------------------------
  // Fail the build on missing required fields or unknown program codes (Doc 08 Q12, Q16).
  eleventyConfig.on('eleventy.before', async () => {
    validateContent('src');
    // Browser scripts (src/scripts) are bundled and minified once. home.js loads the 3D chunk
    // (three.js and the scene) itself, only on capable devices (CR-01).
    const jsDir = path.join(eleventyConfig.directories.output, 'assets/js');
    fs.rmSync(path.join(jsDir, 'chunks'), { recursive: true, force: true }); // no stale hashed chunks
    await esbuild.build({
      // The enquiry form bundles functions/lib/validate.js, so browser and function share one set of rules.
      entryPoints: {
        site: 'src/scripts/site.js',
        home: 'src/scripts/home.js',
        filters: 'src/scripts/filters.js',
        enquiry: 'src/scripts/enquiry.js',
      },
      outdir: jsDir,
      bundle: true,
      splitting: true,
      format: 'esm',
      target: 'es2020',
      minify: true,
      chunkNames: 'chunks/[name]-[hash]',
      legalComments: 'none',
      logLevel: 'warning',
    });
  });

  // Give the enquiry function the current program codes and city list.
  eleventyConfig.on('eleventy.after', () => {
    const { programs } = validateContent('src');
    const cities = yaml.load(fs.readFileSync('src/_data/cities.yaml', 'utf8'));
    const data = {
      programCodes: programs.filter((p) => p.status !== 'Withdrawn').map((p) => p.slug),
      cities,
    };
    const out = `// GENERATED by the Eleventy build from src/content/programs and src/_data/cities.yaml. Do not edit.\nexport default ${JSON.stringify(data)};\n`;
    const file = 'functions/generated/site-data.js';
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
  });

  return {
    dir: { input: 'src', includes: '_includes', layouts: '_includes/layouts', data: '_data', output: '_site' },
    templateFormats: ['njk', 'md', '11ty.js'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
