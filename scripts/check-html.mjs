// HTML validation of every built page (Doc 07 Q31). Rules: .htmlvalidate.json (html-validate recommended).
import { HtmlValidate, FileSystemConfigLoader, formatterFactory } from 'html-validate';
import { builtPages } from './lib/server.mjs';

const loader = new FileSystemConfigLoader();
const validator = new HtmlValidate(loader);
const files = builtPages().map(([, file]) => file);
const reports = [];
for (const file of files) reports.push(await validator.validateFile(file));
const errors = reports.reduce((n, r) => n + r.errorCount, 0);
const failed = reports.filter((r) => !r.valid);
if (failed.length) {
  const text = formatterFactory('stylish');
  for (const r of failed) console.log(text(r.results));
}
console.log(`HTML: ${files.length} pages, ${errors} error(s)`);
process.exitCode = errors ? 1 : 0;
