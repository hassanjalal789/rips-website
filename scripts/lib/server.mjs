// Small static server for the built site (_site), used by the dev server and the checks.
// It serves 404.html for missing pages, can gzip text like a real host, can apply the
// headers in _site/_headers (so the checks run under the real content security policy),
// and can answer POST /api/v1/enquiry with the enquiry function and its mock adapters.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  '.glb': 'model/gltf-binary', '.mp4': 'video/mp4',
};
const TEXT = /^(text\/|application\/(json|xml)|image\/svg)/;

// Parse the _headers file: "/path/*" lines followed by indented "Name: value" lines.
export function readHeaders(root) {
  const file = path.join(root, '_headers');
  if (!fs.existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim();
      const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      current = { re, headers: {} };
      rules.push(current);
    } else if (current) {
      const i = line.indexOf(':');
      current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

export function resolveFile(root, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.includes('\0')) return null;
  const base = path.resolve(root);
  let file = path.join(base, path.normalize(p));
  if (file !== base && !file.startsWith(base + path.sep)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return fs.existsSync(file) ? file : null;
}

export function createServer({ root = '_site', gzip = false, applyHeaders = false, enquiry = null } = {}) {
  root = path.resolve(root);
  const rules = applyHeaders ? readHeaders(root) : [];
  return http.createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];
    if (urlPath === '/api/v1/enquiry' && enquiry) return enquiry(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' });
      return res.end();
    }
    let file = resolveFile(root, urlPath);
    let status = 200;
    if (!file) {
      // Pages without a trailing slash redirect to the one form the site uses (Doc 05 Q26).
      if (!path.extname(urlPath) && resolveFile(root, urlPath + '/')) {
        res.writeHead(301, { location: urlPath + '/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '') });
        return res.end();
      }
      file = path.join(root, '404.html');
      status = 404;
    }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const headers = { 'content-type': type };
    for (const r of rules) if (r.re.test(urlPath)) Object.assign(headers, r.headers);
    let body = fs.readFileSync(file);
    if (gzip && TEXT.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      body = zlib.gzipSync(body);
      headers['content-encoding'] = 'gzip';
    }
    headers['content-length'] = body.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}

export function listen(server, port = 0) {
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server.address().port)));
}

// Every built page: [url, file] for each index.html, plus 404.html.
export function builtPages(root = '_site') {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) {
        const rel = '/' + path.relative(root, full).split(path.sep).join('/');
        out.push([rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel, full]);
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}
