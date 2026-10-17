// Web-standard wrapper: (Request, env) → Response. Works on hosts whose functions take a
// Fetch API Request (for example Cloudflare Pages/Workers, Netlify Functions v2, Vercel, Deno).
// Wire it to POST /api/v1/enquiry once the host is chosen (OD-03). Not deployed yet.
import { handleEnquiry } from '../lib/handler.js';
import { buildDeps } from '../config.js';

export default async function enquiry(request, env = globalThis.process?.env ?? {}) {
  const headers = Object.fromEntries(request.headers.entries());
  const body = await request.text();
  const ip = headers['cf-connecting-ip'] || (headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  const res = await handleEnquiry({ method: request.method, headers, body, ip }, buildDeps(env));
  return new Response(res.body, { status: res.status, headers: res.headers });
}
