const MAX_BYTES = 5 * 1024 * 1024;
const MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

function imageMime(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

function toBase64(bytes) {
  let value = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    value += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(value);
}

export async function readImageForAlt(image, { signal } = {}) {
  const rawUrl = image.currentSrc || image.src;
  if (!rawUrl) throw new Error('This image has no usable source.');
  const url = new URL(rawUrl, document.baseURI);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) image sources are supported.');
  // Cross-origin images can be processed only if the image server explicitly permits CORS.
  // Never send site cookies or authorization headers to another origin.
  const sameOrigin = url.origin === location.origin;
  const response = await fetch(url.href, {
    mode: 'cors', credentials: sameOrigin ? 'same-origin' : 'omit',
    signal: signal || AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Image download failed (${response.status}).`);
  if (Number(response.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('Image is larger than 5 MB.');
  const chunks = [];
  let total = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('This browser cannot read the image response.');
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error('Image is larger than 5 MB.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const mimeType = imageMime(bytes);
  if (!mimeType || !MIME.has(mimeType)) throw new Error('Only PNG, JPEG, and WebP images are supported for AI generation.');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const imageHash = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { imageHash, mimeType, data: toBase64(bytes) };
}

export function imageContext(image) {
  const figure = image.closest('figure');
  const control = image.closest('a[href],button');
  const heading = image.closest('section,article,main')?.querySelector('h1,h2,h3,h4,h5,h6');
  return {
    caption: figure?.querySelector('figcaption')?.textContent?.trim().slice(0, 240) || '',
    controlText: control?.textContent?.trim().slice(0, 120) || '',
    controlKind: control?.tagName.toLowerCase() || '',
    // Only same-origin paths are shared, never URL query strings or fragments.
    controlPath: control?.tagName === 'A' && control.href && new URL(control.href).origin === location.origin
      ? new URL(control.href).pathname.slice(0, 160) : '',
    sectionHeading: heading?.textContent?.trim().slice(0, 120) || '',
  };
}

function endpoint(config) {
  const base = new URL(config?.endpoint || '/api/assistaccess/alt-text', location.href);
  if (base.origin !== location.origin) throw new Error('The alt-text API must be on the website origin.');
  return base.href.replace(/\/$/, '');
}

async function api(config, path, options = {}) {
  if (!config?.enabled || !config?.siteId || typeof config.getToken !== 'function') {
    throw new Error('This site has not configured its authorized alt-text service.');
  }
  const token = await config.getToken();
  if (typeof token !== 'string' || !token) throw new Error('Alt-text authorization is unavailable.');
  const response = await fetch(`${endpoint(config)}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    signal: options.signal || AbortSignal.timeout(20000),
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* malformed response */ }
  if (!response.ok) throw new Error(payload?.error || `Alt-text service failed (${response.status}).`);
  return payload;
}

export async function generateAlt(config, image, prepared) {
  if (!config?.allowExternalProcessing || !config?.disclosure) {
    throw new Error('The site must disclose and enable external image processing first.');
  }
  const data = prepared || await readImageForAlt(image);
  const result = await api(config, '/generate', {
    method: 'POST',
    body: JSON.stringify({ siteId: config.siteId, mimeType: data.mimeType, data: data.data,
      imageHash: data.imageHash, context: imageContext(image) }),
  });
  if (typeof result?.suggestion !== 'string') throw new Error('The AI service returned no usable description.');
  return { ...result, imageHash: data.imageHash };
}

export async function savedCorrection(config, identity) {
  const query = new URLSearchParams(identity);
  return api(config, `/correction?${query}`);
}

export async function saveCorrection(config, identity, alt) {
  return api(config, '/correction', { method: 'PUT', body: JSON.stringify({ ...identity, alt }) });
}

export async function deleteCorrection(config, identity) {
  return api(config, '/correction', { method: 'DELETE', body: JSON.stringify(identity) });
}

export function correctionIdentity(config, image, imageHash) {
  const imageId = image.getAttribute('data-assistaccess-image-id')?.trim();
  if (!imageId) throw new Error('Saving requires a stable data-assistaccess-image-id set by the site owner.');
  return { siteId: config.siteId, pagePath: location.pathname, imageId, imageHash };
}
