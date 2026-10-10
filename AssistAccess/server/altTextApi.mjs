import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 7 * 1024 * 1024;

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

function signature(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Issue only on a customer-controlled server, never from browser JavaScript. */
export function issueSiteToken(secret, { siteId, origin, scopes = ['read'], expiresAt = Date.now() + 5 * 60_000 }) {
  const payload = Buffer.from(JSON.stringify({ siteId, origin, scopes, exp: expiresAt })).toString('base64url');
  return `${payload}.${signature(secret, payload)}`;
}

function verifyToken(secret, token) {
  if (!secret || typeof token !== 'string' || token.length > 2048) return null;
  const [payload, mac, extra] = token.split('.');
  if (!payload || !mac || extra) return null;
  const expected = Buffer.from(signature(secret, payload));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed.exp > Date.now() && parsed.exp < Date.now() + 60 * 60_000 ? parsed : null;
  } catch { return null; }
}

function validateIdentity(value) {
  if (!value || typeof value !== 'object') return null;
  const { siteId, pagePath, imageId, imageHash } = value;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(siteId || '') ||
      typeof pagePath !== 'string' || !pagePath.startsWith('/') || pagePath.length > 500 || pagePath.includes('?') || pagePath.includes('#') ||
      !/^[a-zA-Z0-9._:-]{1,120}$/.test(imageId || '') ||
      !/^[a-f0-9]{64}$/.test(imageHash || '')) return null;
  return { siteId, pagePath, imageId, imageHash };
}

function cleanText(text, allowEmpty = false) {
  if (typeof text !== 'string') return null;
  const clean = text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if ((!clean && !allowEmpty) || clean.length > 500 || /^(an? )?(image|picture|photo) of (an? )?(image|picture|photo)\.?$/i.test(clean)) return null;
  return clean;
}

function sniffMime(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

async function bodyJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('too-large'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('invalid-json'), { status: 400 }); }
}

function contextValue(context) {
  const result = {};
  for (const [key, limit] of Object.entries({ caption: 240, controlText: 120, controlKind: 16,
    controlPath: 160, sectionHeading: 120 })) {
    result[key] = typeof context?.[key] === 'string' ? context[key].slice(0, limit).replace(/[\u0000-\u001f]/g, ' ') : '';
  }
  return result;
}

/** Framework-neutral Node HTTP handler. No remote URL fetching; the browser supplies validated bytes. */
export function createAltTextHandler({ sites, secret, provider, store, rateLimit = 30 } = {}) {
  const buckets = new Map();
  return async function handle(req, res) {
    const url = new URL(req.url, 'http://internal.invalid');
    if (!url.pathname.startsWith('/api/assistaccess/alt-text/')) return false;
    const token = verifyToken(secret, req.headers.authorization?.replace(/^Bearer\s+/i, ''));
    const site = token && sites?.[token.siteId];
    if (!site || !Array.isArray(site.origins) || !site.origins.includes(token.origin)) {
      send(res, 401, { error: 'Alt-text authorization failed.' }); return true;
    }
    const scope = url.pathname.endsWith('/generate') ? 'generate' :
      req.method === 'GET' ? 'read' : 'write';
    if (!Array.isArray(token.scopes) || !token.scopes.includes(scope)) {
      send(res, 403, { error: 'This session is not authorized for that alt-text operation.' }); return true;
    }
    let callerOrigin = req.headers.origin;
    if (!callerOrigin && req.headers.referer) {
      try { callerOrigin = new URL(req.headers.referer).origin; } catch { /* invalid referrer */ }
    }
    if (callerOrigin && callerOrigin !== token.origin) {
      send(res, 403, { error: 'This domain is not authorized for the site.' }); return true;
    }
    const minute = Math.floor(Date.now() / 60000);
    const key = `${token.siteId}:${minute}`;
    if (buckets.size > 1000) buckets.clear();
    const count = (buckets.get(key) || 0) + 1;
    buckets.set(key, count);
    if (count > rateLimit) { send(res, 429, { error: 'Alt-text request limit reached. Retry later.' }); return true; }
    try {
      if (url.pathname.endsWith('/generate') && req.method === 'POST') {
        if (!site.allowAI || !provider) { send(res, 503, { error: 'AI suggestions are not configured for this site.' }); return true; }
        const body = await bodyJson(req);
        if (body?.siteId !== token.siteId || typeof body.data !== 'string' ||
            !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) {
          send(res, 400, { error: 'Invalid image request.' }); return true;
        }
        const bytes = Buffer.from(body.data, 'base64');
        const mimeType = sniffMime(bytes);
        if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || !mimeType || mimeType !== body.mimeType ||
            createHash('sha256').update(bytes).digest('hex') !== body.imageHash) {
          send(res, 415, { error: 'Unsupported or changed image data.' }); return true;
        }
        const proposal = await provider.generate({ bytes, mimeType, context: contextValue(body.context) });
        const suggestion = cleanText(proposal?.suggestion);
        if (!suggestion) { send(res, 502, { error: 'AI returned no usable description. Please retry or write one.' }); return true; }
        send(res, 200, { suggestion, complex: proposal.complex === true }); return true;
      }
      if (url.pathname.endsWith('/correction')) {
        if (!site.allowPersistence || !store) { send(res, 503, { error: 'Saved corrections are not configured for this site.' }); return true; }
        const body = req.method === 'GET' ? Object.fromEntries(url.searchParams) : await bodyJson(req);
        const id = validateIdentity(body);
        if (!id || id.siteId !== token.siteId) { send(res, 400, { error: 'Invalid image identity.' }); return true; }
        if (req.method === 'GET') { send(res, 200, store.get(id) || { alt: null }); return true; }
        if (req.method === 'PUT') {
          const alt = cleanText(body.alt, true);
          if (alt === null) { send(res, 400, { error: 'Invalid alternative text.' }); return true; }
          send(res, 200, store.put(id, alt)); return true;
        }
        if (req.method === 'DELETE') { send(res, 200, { removed: store.delete(id) }); return true; }
      }
      send(res, 404, { error: 'Unknown alt-text operation.' }); return true;
    } catch (error) {
      send(res, error.status || 502, { error: error.status ? 'Invalid or oversized request.' :
        'The alt-text service could not complete the operation. Retry later.' });
      return true;
    }
  };
}
