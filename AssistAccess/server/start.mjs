import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAltTextHandler, issueSiteToken } from './altTextApi.mjs';
import { createOpenAIProvider, createMockProvider } from './altTextProvider.mjs';
import { createAltTextStore } from './altTextStore.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const testMode = process.env.ASSISTACCESS_TEST_MODE === '1' && process.env.NODE_ENV !== 'production';
const secret = process.env.ASSISTACCESS_TOKEN_SECRET;
if (!secret || secret.length < 32) throw new Error('ASSISTACCESS_TOKEN_SECRET must contain at least 32 characters.');
let sites;
try { sites = JSON.parse(process.env.ASSISTACCESS_SITES_JSON || '{}'); }
catch { throw new Error('ASSISTACCESS_SITES_JSON must be a JSON object.'); }
const provider = testMode ? createMockProvider() : createOpenAIProvider();
const store = Object.values(sites).some((site) => site.allowPersistence) ?
  createAltTextStore(process.env.ASSISTACCESS_DB_PATH || resolve(projectRoot, 'alt-corrections.sqlite')) : null;
const handleApi = createAltTextHandler({ sites, secret, provider, store });

async function staticFile(res, relative) {
  const file = resolve(projectRoot, relative);
  if (!file.startsWith(`${projectRoot}${sep}`)) { res.writeHead(403).end(); return; }
  try {
    const bytes = await readFile(file);
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' :
      file.endsWith('.js') ? 'text/javascript; charset=utf-8' :
      file.endsWith('.png') ? 'image/png' :
      file.endsWith('.svg') ? 'image/svg+xml' :
      file.endsWith('.gif') ? 'image/gif' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://local.invalid').pathname;
  if (testMode && path === '/api/assistaccess/alt-text/test-token') {
    const origin = req.headers.origin || `http://${req.headers.host}`;
    const siteId = new URL(req.url, 'http://local.invalid').searchParams.get('siteId') || 'test';
    const site = sites[siteId];
    if (!site?.origins?.includes(origin)) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ token: issueSiteToken(secret, { siteId, origin,
      scopes: ['generate', 'read', 'write'] }) }));
    return;
  }
  if (await handleApi(req, res)) return;
  if (testMode && /^\/test-host\/[a-zA-Z0-9_-]+\.html$/.test(path)) {
    await staticFile(res, path.slice(1)); return;
  }
  if (testMode && path === '/test-host/') {
    await staticFile(res, 'test-host/index.html'); return;
  }
  if (testMode && /^\/test-host\/images\/[a-zA-Z0-9_-]+\.(png|svg|gif)$/.test(path)) {
    await staticFile(res, path.slice(1)); return;
  }
  if (testMode && path === '/embed/assistaccess.js') {
    await staticFile(res, 'dist/embed/assistaccess.js'); return;
  }
  res.writeHead(404).end();
});
const port = Number(process.env.ASSISTACCESS_API_PORT || 8787);
server.listen(port, testMode ? '127.0.0.1' : '0.0.0.0', () => {
  process.stdout.write(`AssistAccess alt-text API listening on ${port}\n`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); store?.close(); });
