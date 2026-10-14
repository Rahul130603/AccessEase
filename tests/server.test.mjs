import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';

test('HTTP deployment: login, account isolation, payment-free keys, assets, persistence and session expiry', { timeout: 60000 }, async () => {
  const workspace = process.env.TEST_APP_ROOT || fileURLToPath(new URL('../', import.meta.url));
  const directory = await mkdtemp(path.join(workspace, '.server-test-'));
  const password = randomBytes(18).toString('hex');
  const salt = randomBytes(16);
  await writeFile(path.join(directory, 'auth.json'), JSON.stringify({ username: 'deployment-test', salt: salt.toString('hex'), hash: scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 67108864 }).toString('hex') }));
  const children = new Set();
  async function start(extra = {}) {
    const child = spawn(process.execPath, [process.env.TEST_SERVER_ENTRY || 'server/admin.mjs'], {
      cwd: workspace,
      env: { ...process.env, PORT: '0', BIND_HOST: '127.0.0.1', ADMIN_CREDENTIAL_FILE: path.join(directory, 'auth.json'), PLATFORM_DATA_DIR: directory, COOKIE_SECURE: 'true', PUBLIC_ORIGIN: 'https://app.example', RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '', ...extra },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    const base = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/ready on port (\d+)/);
        if (match) resolve(`http://127.0.0.1:${match[1]}`);
      });
      let errors = '';
      child.stderr.on('data', chunk => { errors += chunk; });
      child.once('exit', code => reject(new Error(`Server exited ${code}: ${errors}`)));
      child.once('error', reject);
    });
    return { child, base };
  }
  async function stop(child) {
    if (child.exitCode === null && child.signalCode === null) {
      const done = new Promise(resolve => child.once('exit', resolve));
      child.kill(); await done;
    }
    children.delete(child);
  }
  let active;
  let cookie = '', csrf = '';
  async function request(route, { method = 'GET', data, headers = {}, authenticated = true } = {}) {
    const response = await fetch(active.base + route, {
      method, redirect: 'manual',
      headers: { ...(authenticated && cookie ? { Cookie: cookie } : {}), ...(data !== undefined ? { 'Content-Type': 'application/json', Origin: 'https://app.example', 'X-CSRF-Token': csrf } : {}), ...headers },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const text = await response.text();
    let value; try { value = JSON.parse(text); } catch { /* Static asset. */ }
    return { status: response.status, headers: response.headers, value, text };
  }
  const post = (route, data, options) => request(route, { method: 'POST', data, ...options });
  async function login(identifier = 'deployment-test', pass = password) {
    const result = await post('/api/auth/login', { identifier, password: pass });
    assert.equal(result.status, 200);
    const setCookie = result.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /Secure/); assert.match(setCookie, /SameSite=Strict/);
    cookie = setCookie.split(';')[0];
    csrf = (await request('/api/auth/session')).value.csrf;
    return cookie;
  }
  try {
    active = await start();
    assert.equal((await request('/health')).status, 200);
    assert.equal((await request('/admin', { authenticated: false })).status, 303);
    assert.equal((await request('/api/platform/overview', { authenticated: false })).status, 401);
    assert.equal((await post('/api/auth/login', { identifier: 'deployment-test', password }, { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await post('/api/auth/login', { identifier: 'deployment-test', password: 'wrong' })).status, 401);
    await login();
    assert.equal((await request('/admin')).status, 200);
    assert.equal((await request('/')).status, 200);
    assert.equal((await request('/media/silent.mp4', { headers: { Range: 'bytes=0-99' } })).status, 206);
    for (const asset of ['/embed.js', '/widget.js', '/team-features.js', '/accessibility-badge.png']) {
      const result = await request(asset, { authenticated: false });
      assert.equal(result.status, 200, asset);
      assert.equal(result.headers.get('access-control-allow-origin'), '*');
    }
    const clientPassword = randomBytes(18).toString('hex');
    await post('/api/auth/logout', {}); cookie = ''; csrf = '';
    const registered = await post('/api/auth/register', { email: 'first@example.test', password: clientPassword });
    assert.equal(registered.status, 201);
    cookie = registered.headers.get('set-cookie').split(';')[0];
    csrf = (await request('/api/auth/session')).value.csrf;
    assert.equal((await post('/api/platform/config', { amount: 100, days: 1 })).status, 403);
    const site = await post('/api/platform/sites', { name: 'Live client', origin: 'https://client.example' });
    assert.equal(site.status, 201);
    const generated = await post('/api/platform/keys', { siteId: site.value.site.id, mode: 'live' });
    assert.equal(generated.status, 201);
    const key = generated.value.key;
    const validate = origin => request('/api/widget/validate', { authenticated: false, headers: { Origin: origin, 'X-AccessEase-Key': key.token } });
    assert.equal((await validate('https://client.example')).status, 200);
    assert.equal((await validate('https://evil.example')).status, 403);
    assert.equal((await request('/api/widget/validate', { method: 'OPTIONS', authenticated: false, headers: { Origin: 'https://client.example', 'Access-Control-Request-Headers': 'x-accessease-key' } })).status, 204);
    const firstCookie = cookie;
    await post('/api/auth/logout', {}); cookie = ''; csrf = '';
    const second = await post('/api/auth/register', { email: 'second@example.test', password: clientPassword });
    assert.equal(second.status, 201); cookie = second.headers.get('set-cookie').split(';')[0];
    csrf = (await request('/api/auth/session')).value.csrf;
    assert.equal((await request('/api/platform/overview')).value.sites.length, 0);
    assert.equal((await post('/api/platform/keys', { siteId: site.value.site.id, mode: 'live' })).status, 400);
    assert.equal((await request('/api/auth/session', { headers: { Cookie: firstCookie } })).status, 401);
    await assert.rejects(start(), /already in use/);
    await stop(active.child); active = await start();
    assert.equal((await request('/api/auth/session')).status, 401);
    await login('first@example.test', clientPassword);
    assert.equal((await request('/api/platform/overview')).value.keys.length, 1);
    assert.equal((await validate('https://client.example')).status, 200);
    assert.equal((await post('/api/platform/keys/revoke', { id: key.id })).status, 200);
    assert.equal((await validate('https://client.example')).status, 403);
    await stop(active.child); active = await start({ SESSION_TTL_MS: '300' });
    await login();
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal((await request('/api/auth/session')).status, 401);
  } finally {
    for (const child of children) await stop(child);
    if (path.dirname(directory) === path.resolve(workspace) && path.basename(directory).startsWith('.server-test-')) await rm(directory, { recursive: true, force: true });
  }
});
