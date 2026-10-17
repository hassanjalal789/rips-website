// Internal link check (Doc 05 Q35): every href, src and srcset on every built page must point to a
// file in _site, and every #fragment to an id on the target page. External links are listed, not fetched.
import fs from 'node:fs';
import { builtPages, resolveFile } from './lib/server.mjs';

const ROOT = '_site';
const pages = builtPages(ROOT);
const html = new Map(pages.map(([url, file]) => [file, fs.readFileSync(file, 'utf8')]));
const idsOf = (text) => new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const external = new Set();
const problems = [];

for (const [url, file] of pages) {
  const text = html.get(file);
  const refs = [];
  for (const m of text.matchAll(/\s(href|src)="([^"]*)"/g)) refs.push(m[2]);
  for (const m of text.matchAll(/\ssrcset="([^"]*)"/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (const raw of refs) {
    const ref = raw.replace(/&amp;/g, '&');
    if (!ref || /^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (/^https?:\/\//.test(ref)) { if (!ref.startsWith('https://rips.edu.pk')) external.add(ref.split('?')[0]); continue; }
    const target = new URL(ref, `http://x${url}`);
    const [pathOnly, frag] = [target.pathname, target.hash.slice(1)];
    const targetFile = pathOnly === url ? file : resolveFile(ROOT, pathOnly);
    if (!targetFile) { problems.push(`${url}: broken link ${ref}`); continue; }
    if (frag && targetFile.endsWith('.html')) {
      const ids = idsOf(html.get(targetFile) ?? fs.readFileSync(targetFile, 'utf8'));
      if (!ids.has(decodeURIComponent(frag))) problems.push(`${url}: missing #${frag} in ${pathOnly}`);
    }
  }
}
for (const p of problems) console.log(`  ✗ ${p}`);
console.log(`Links: ${pages.length} pages, ${problems.length} broken. External (not fetched): ${[...external].join(', ') || 'none'}`);
process.exitCode = problems.length ? 1 : 0;
