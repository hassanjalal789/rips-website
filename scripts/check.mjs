// Runs every check against the built site (npm run check builds first). Fails if any check fails.
// Then prints what still blocks launch: placeholders, SAMPLE content, dummy contact links and the
// filled-in drafts (data-draft="OD-xx" in pages, draft_fields in settings) that still need approval.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { builtPages } from './lib/server.mjs';

const checks = ['check-html.mjs', 'check-links.mjs', 'check-a11y.mjs', 'check-weight.mjs', 'check-form.mjs'];
let failed = 0;
for (const c of checks) {
  console.log(`\n▶ ${c}`);
  const r = spawnSync(process.execPath, [`scripts/${c}`], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

// Launch blockers (not failures): every [TO CONFIRM …] placeholder, SAMPLE tag, dummy contact link and draft.
const counts = { tbc: 0, sample: 0, dummy: 0 };
const ods = new Map();
const drafts = new Map();
for (const [, file] of builtPages()) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\[TO CONFIRM — [^\]]*?(OD-\d\d)?\]/g)) {
    counts.tbc++;
    if (m[1]) ods.set(m[1], (ods.get(m[1]) || 0) + 1);
  }
  counts.sample += (html.match(/class="sample-tag"/g) || []).length;
  counts.dummy += (html.match(/data-placeholder="/g) || []).length;
  for (const m of html.matchAll(/data-draft="([^"]+)"/g)) drafts.set(m[1], (drafts.get(m[1]) || 0) + 1);
}
const list = (map) => [...map].sort().map(([od, n]) => `${od} ×${n}`).join(', ') || 'none';
const draftSettings = yaml.load(fs.readFileSync('src/_data/settings.yaml', 'utf8')).draft_fields || [];
console.log(`\nBefore launch: ${counts.tbc} placeholders (${list(ods)}), ${counts.sample} SAMPLE tags, ${counts.dummy} dummy contact links.`);
console.log(`Drafts to approve: ${[...drafts.values()].reduce((a, b) => a + b, 0)} marked in pages (${list(drafts)}); settings: ${draftSettings.join(', ') || 'none'}.`);
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exitCode = failed ? 1 : 0;
