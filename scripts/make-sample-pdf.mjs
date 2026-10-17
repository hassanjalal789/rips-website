// Writes a small one-page PDF stamped SAMPLE, for placeholder notices and downloads (Doc 08 Q17).
// Usage: node scripts/make-sample-pdf.mjs <out.pdf> "Line one" "Line two" ...
import fs from 'node:fs';

const [out, ...lines] = process.argv.slice(2);
if (!out) throw new Error('usage: make-sample-pdf.mjs <out.pdf> lines...');
const esc = (s) => s.replace(/[\\()]/g, (c) => '\\' + c).replace(/[^\x20-\x7e]/g, '-');
const text = ['SAMPLE - NOT A REAL DOCUMENT', ...lines]
  .map((l, i) => `BT /F1 ${i === 0 ? 20 : 12} Tf 60 ${770 - i * 28} Td (${esc(l)}) Tj ET`)
  .join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offsets = [];
objects.forEach((o, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(out, pdf);
