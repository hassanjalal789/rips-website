// Local development: rebuilds on change (eleventy --watch) and serves _site on http://localhost:8080,
// with POST /api/v1/enquiry answered by the real enquiry function using its mock adapters, so the
// form works end to end without any external service or key (Doc 07 Q13).
import { spawn } from 'node:child_process';
import { createServer, listen } from './lib/server.mjs';
import { nodeEnquiry } from '../functions/platforms/node-http.js';
import { buildDeps } from '../functions/config.js';

const PORT = Number(process.env.PORT) || 8080;
// In a GitHub Codespace the browser reaches the site through a forwarded https address, which must be
// allowed to post the enquiry form too (.devcontainer/devcontainer.json).
const { CODESPACE_NAME, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: FORWARD_DOMAIN } = process.env;
const codespaceUrl = CODESPACE_NAME && FORWARD_DOMAIN ? `https://${CODESPACE_NAME}-${PORT}.${FORWARD_DOMAIN}` : '';
const origins = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`, codespaceUrl].filter(Boolean);
const env = { ALLOWED_ORIGINS: origins.join(','), ...process.env };
const deps = buildDeps(env);

const eleventy = spawn(process.execPath, ['node_modules/@11ty/eleventy/cmd.cjs', '--watch', '--quiet'], { stdio: 'inherit' });
process.on('exit', () => eleventy.kill());
process.on('SIGINT', () => process.exit(0));

const server = createServer({ applyHeaders: true, enquiry: (req, res) => nodeEnquiry(req, res, deps) });
await listen(server, PORT);
console.log(`RIPS site on http://localhost:${PORT} (enquiries go to an in-memory mock store; each outcome is logged here)`);
if (codespaceUrl) console.log(`Open it at ${codespaceUrl}`);
