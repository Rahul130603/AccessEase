import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { createAltTextHandler, issueSiteToken } from '../altTextApi.mjs';
import { createMockProvider } from '../altTextProvider.mjs';
import { createAltTextStore } from '../altTextStore.mjs';
import { applyImageAlt, snapshotImage, undoImageAlt } from '../../src/accessibility/features/altText/altTextWorkflow.js';

const origin = 'http://localhost:8123';
const secret = 'test-secret-with-at-least-thirty-two-characters';
const image = await readFile(new URL('../../test-host/images/chart.png', import.meta.url));
const imageHash = createHash('sha256').update(image).digest('hex');

async function withServer(callback, options = {}) {
  const store = createAltTextStore(':memory:');
  const sites = {
    siteA: { origins: [origin], allowAI: true, allowPersistence: true },
    siteB: { origins: [origin], allowAI: true, allowPersistence: true },
    /** Registered tenant that is not allowed to use the AI provider. */
    siteC: { origins: [origin], allowAI: false, allowPersistence: false },
  };
  const handler = createAltTextHandler({ sites, secret,
    provider: options.provider === undefined ? createMockProvider() : options.provider, store,
    rateLimit: options.rateLimit || 30 });
  const server = createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/assistaccess/alt-text`;
  const token = (siteId, scopes = ['generate', 'read', 'write']) => issueSiteToken(secret, { siteId, origin, scopes });
  async function call(siteId, path, method, body) {
    const response = await fetch(`${base}${path}`, { method,
      headers: { Origin: origin, Authorization: `Bearer ${token(siteId)}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }
  try { await callback({ call, token, base, store }); }
  finally { await new Promise((resolve) => server.close(resolve)); store.close(); }
}

test('configured mock provider receives real PNG bytes and returns a reviewed proposal', async () => {
  await withServer(async ({ call }) => {
    const result = await call('siteA', '/generate', 'POST', {
      siteId: 'siteA', mimeType: 'image/png', imageHash, data: image.toString('base64'),
      context: { caption: 'Quarterly sales' },
    });
    assert.equal(result.status, 200);
    assert.match(result.data.suggestion, /Four blue bars/);
    const bad = await call('siteA', '/generate', 'POST', {
      siteId: 'siteA', mimeType: 'image/png', imageHash: '0'.repeat(64), data: image.toString('base64'),
    });
    assert.equal(bad.status, 415);
  });
});

test('approved corrections persist by tenant, page, stable id and image hash, then update and delete', async () => {
  await withServer(async ({ call }) => {
    const id = { siteId: 'siteA', pagePath: '/reports', imageId: 'sales-chart', imageHash };
    assert.equal((await call('siteA', '/correction', 'PUT', { ...id, alt: 'Sales rise over four quarters' })).data.version, 1);
    const query = `?${new URLSearchParams(id)}`;
    assert.equal((await call('siteA', `/correction${query}`, 'GET')).data.alt, 'Sales rise over four quarters');
    assert.equal((await call('siteA', '/correction', 'PUT', { ...id, alt: 'Four bars rise from Q1 to Q4' })).data.version, 2);
    assert.equal((await call('siteA', `/correction?${new URLSearchParams({ ...id, imageHash: '1'.repeat(64) })}`, 'GET')).data.alt, null);
    assert.equal((await call('siteB', `/correction${query}`, 'GET')).status, 400);
    assert.equal((await call('siteA', '/correction', 'DELETE', id)).data.removed, true);
    assert.equal((await call('siteA', `/correction${query}`, 'GET')).data.alt, null);
    assert.equal((await call('siteA', '/correction', 'PUT', { ...id, alt: '' })).data.alt, '');
    assert.equal((await call('siteA', `/correction${query}`, 'GET')).data.alt, '');
  });
});

test('unauthorized, cross-origin and malformed requests fail without leaking provider errors', async () => {
  await withServer(async ({ base, token, call }) => {
    const missingToken = await fetch(`${base}/correction`, { headers: { Origin: origin } });
    assert.equal(missingToken.status, 401);
    const wrongOrigin = await fetch(`${base}/correction`, { headers: {
      Origin: 'https://elsewhere.example', Authorization: `Bearer ${token('siteA')}` } });
    assert.equal(wrongOrigin.status, 403);
    const wrongTenant = await call('siteA', '/generate', 'POST', { siteId: 'siteB', data: image.toString('base64') });
    assert.equal(wrongTenant.status, 400);
    const readOnly = await fetch(`${base}/correction`, { method: 'PUT',
      headers: { Origin: origin, Authorization: `Bearer ${token('siteA', ['read'])}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}) });
    assert.equal(readOnly.status, 403);
  }, { provider: { async generate() { throw new Error('secret-provider-detail'); } } });
});

test('a site without an AI provider or with AI disabled gets a configuration error, never a suggestion', async () => {
  const request = { mimeType: 'image/png', imageHash, data: image.toString('base64'), context: {} };
  // No provider is configured on the server at all (for example OPENAI_API_KEY is missing).
  await withServer(async ({ call }) => {
    const result = await call('siteA', '/generate', 'POST', { siteId: 'siteA', ...request });
    assert.equal(result.status, 503);
    assert.match(result.data.error, /not configured/);
    assert.equal(result.data.suggestion, undefined);
  }, { provider: null });
  // The tenant exists but its registry entry does not grant AI use.
  await withServer(async ({ call }) => {
    const result = await call('siteC', '/generate', 'POST', { siteId: 'siteC', ...request });
    assert.equal(result.status, 503);
    assert.match(result.data.error, /not configured/);
    assert.equal(result.data.suggestion, undefined);
  });
});

test('unsupported image bytes and unusable model text are refused instead of applied', async () => {
  const svg = await readFile(new URL('../../test-host/images/vector.svg', import.meta.url));
  const svgHash = createHash('sha256').update(svg).digest('hex');
  await withServer(async ({ call }) => {
    const vector = await call('siteA', '/generate', 'POST', { siteId: 'siteA', mimeType: 'image/svg+xml',
      imageHash: svgHash, data: svg.toString('base64'), context: {} });
    assert.equal(vector.status, 415);
    const unusable = await call('siteA', '/generate', 'POST', { siteId: 'siteA', mimeType: 'image/png',
      imageHash, data: image.toString('base64'), context: {} });
    assert.equal(unusable.status, 502);
    assert.equal(unusable.data.suggestion, undefined);
  }, { provider: { async generate() { return { suggestion: 'image of a picture' }; } } });
});

test('oversized bodies and rate limits are refused before the provider is called', async () => {
  let calls = 0;
  await withServer(async ({ call }) => {
    const first = await call('siteA', '/generate', 'POST', { siteId: 'siteA', mimeType: 'image/png',
      imageHash, data: image.toString('base64'), context: {} });
    assert.equal(first.status, 200);
    const second = await call('siteA', '/generate', 'POST', { siteId: 'siteA', mimeType: 'image/png',
      imageHash, data: image.toString('base64'), context: {} });
    assert.equal(second.status, 429);
    assert.equal(calls, 1);
  }, { rateLimit: 1, provider: { async generate() { calls += 1; return { suggestion: 'A blue badge' }; } } });

  await withServer(async ({ base, token }) => {
    const response = await fetch(`${base}/generate`, { method: 'POST',
      headers: { Origin: origin, Authorization: `Bearer ${token('siteA')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: 'siteA', padding: 'x'.repeat(8 * 1024 * 1024) }) });
    assert.equal(response.status, 413);
    assert.equal(calls, 1);
  }, { provider: { async generate() { calls += 1; return { suggestion: 'A blue badge' }; } } });
});

test('host image alt is verified, applied and undone without changing its source', () => {
  const originalDocument = globalThis.document;
  globalThis.document = {};
  const attrs = new Map([['src', '/chart.png']]);
  const hostImage = {
    tagName: 'IMG', isConnected: true, ownerDocument: globalThis.document, currentSrc: '',
    getAttribute: (name) => attrs.has(name) ? attrs.get(name) : null,
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    closest: () => null,
  };
  try {
    const snapshot = snapshotImage(hostImage);
    const edit = applyImageAlt(snapshot, 'Four bars rise from Q1 to Q4');
    assert.equal(hostImage.getAttribute('alt'), 'Four bars rise from Q1 to Q4');
    assert.equal(hostImage.getAttribute('src'), '/chart.png');
    assert.equal(undoImageAlt(edit), true);
    assert.equal(hostImage.hasAttribute('alt'), false);
    const decorative = applyImageAlt(snapshotImage(hostImage), '', { decorative: true });
    assert.equal(hostImage.getAttribute('alt'), '');
    undoImageAlt(decorative);
    hostImage.setAttribute('alt', 'Existing meaningful description');
    assert.throws(() => applyImageAlt(snapshotImage(hostImage), 'Replacement'), /preserved/);
    const stale = snapshotImage(hostImage);
    hostImage.setAttribute('src', '/different.png');
    assert.throws(() => applyImageAlt(stale, 'Replacement', { allowReplace: true }), /changed/);
  } finally { globalThis.document = originalDocument; }
});
