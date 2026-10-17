// Node http adapter used by the local dev server (scripts/dev.mjs).
import { handleEnquiry } from '../lib/handler.js';

export async function nodeEnquiry(req, res, deps) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) break; // stop reading; the handler returns 413 for anything over 8 KB
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  const out = await handleEnquiry({ method: req.method, headers: req.headers, body, ip: req.socket.remoteAddress }, deps);
  res.writeHead(out.status, out.headers);
  res.end(out.body);
}
