/**
 * Deterministic browser checks for the alt-text workflow's honest failure states.
 *
 *     npm run test:browser:alt:edges      (with `npm run alt-api` running in test mode)
 *
 * The happy path (generate → review → apply → undo → save → reload) lives in
 * browser-test.mjs. This script covers what that flow does not:
 *
 *   1. the widget never reports or edits its own interface;
 *   2. alt="" on a small image is treated as decorative, not as an error;
 *   3. existing meaningful alt text is left alone;
 *   4. an image format the model cannot read produces a clear limitation, no suggestion;
 *   5. a failing network request produces a retryable error, never a fake success, and
 *      retrying after the failure succeeds;
 *   6. the request the browser sends carries site, MIME type, byte hash and context;
 *   7. an image that only gets a box once it finishes loading is still reported;
 *   8. a dynamically inserted image is reported once, not repeatedly;
 *   9. a site with no configured service says so and still allows a manual, reviewed edit;
 *  10. a site whose server has no AI provider reports the configuration error.
 *
 * Chrome is driven through the DevTools protocol with `puppeteer-core`-free plumbing so the
 * same script works without downloading a browser.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.ASSISTACCESS_TEST_HOST || 'http://127.0.0.1:8787';
const tempRoot = resolve(tmpdir());
const profile = await mkdtemp(join(tempRoot, 'assistaccess-alt-edges-'));
const port = 9700 + Math.floor(Math.random() * 300);
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'],
{ stdio: 'ignore', windowsHide: true });

/**
 * A second origin that serves a real PNG with **no** CORS headers: the page can render the
 * image, the browser refuses to hand its bytes to the widget. That is the honest cross-origin
 * case, and it must not end in a fabricated description.
 */
const corslessPort = Number(process.env.ASSISTACCESS_CORSLESS_PORT || 8788);
const corslessImage = await readFile(new URL('./images/chart.png', import.meta.url));
const corsless = createServer((req, res) => {
  if (req.url === '/chart.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': corslessImage.length });
    res.end(corslessImage);
    return;
  }
  res.writeHead(404).end();
});
await new Promise((done, fail) => {
  corsless.once('error', fail);
  corsless.listen(corslessPort, '127.0.0.1', done);
});

let socket;
let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const generateRequests = [];
let blockGenerate = false;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(fn, label, timeout = 20000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try { last = await fn(); if (last) return last; } catch (error) { last = error.message; }
    await sleep(120);
  }
  throw new Error(`Timed out waiting for ${label} (last value: ${JSON.stringify(last)})`);
}

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

const ROOT = `document.querySelector('[data-a11ytb-host]')?.shadowRoot`;
const FEATURE = `'Image alternative text'`;
const cardFor = (file) => `Array.from(${ROOT}?.querySelectorAll('.a11ytb-alt-card')||[]).find(el=>el.querySelector('img')?.src.includes(${JSON.stringify(file)}))`;
const clickIn = (scope, label) => evaluate(`(()=>{const el=Array.from((${scope})?.querySelectorAll('button')||[]).find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!el)return false;el.click();return true})()`);
const textIn = (scope) => evaluate(`(${scope})?.textContent||''`);
const typeInto = (scope, value) => evaluate(`(()=>{const el=(${scope})?.querySelector('textarea');if(!el)return false;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(value)});
  el.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);

async function openFeature() {
  await waitFor(() => evaluate(`Boolean(${ROOT}?.querySelector('.a11ytb-launcher'))`), 'launcher');
  await evaluate(`(()=>{const b=${ROOT}.querySelector('.a11ytb-launcher');if(b.getAttribute('aria-expanded')!=='true')b.click()})()`);
  await waitFor(() => evaluate(`Boolean(${ROOT}?.querySelector('.a11ytb-widget'))`), 'panel');
  await evaluate(`(()=>{const b=Array.from(${ROOT}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent===${FEATURE});
    if(b&&b.getAttribute('aria-expanded')!=='true')b.click()})()`);
  await waitFor(() => evaluate(`Array.from(${ROOT}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent===${FEATURE})?.getAttribute('aria-expanded')==='true'`), 'expanded feature');
}

async function navigate(path) {
  await call('Page.navigate', { url: `${baseUrl}${path}` });
  await waitFor(() => evaluate(`document.readyState==='complete' && Boolean(${ROOT}?.querySelector('.a11ytb-launcher'))`), `page ${path}`);
}

const results = {};
try {
  const target = await waitFor(async () => {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    return pages.find((entry) => entry.type === 'page')?.webSocketDebuggerUrl;
  }, 'Chrome DevTools');
  socket = new WebSocket(target);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result || {});
    }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      if (request.url.includes('/alt-text/generate')) {
        generateRequests.push({ url: request.url, body: request.postData ? JSON.parse(request.postData) : null });
        call(blockGenerate ? 'Fetch.failRequest' : 'Fetch.continueRequest',
          blockGenerate ? { requestId, errorReason: 'ConnectionFailed' } : { requestId }).catch(() => {});
      } else {
        call('Fetch.continueRequest', { requestId }).catch(() => {});
      }
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      const text = message.params.args?.map((arg) => arg.value || arg.description).join(' ') || '';
      // A deliberately failed request and the broken fixture image are expected here.
      if (!/not-found\.png|Failed to fetch|ERR_FAILED|net::ERR/.test(text)) consoleErrors.push(text);
    }
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*/api/assistaccess/alt-text/*', requestStage: 'Request' }] });

  // ── 1–3, 7–8: the ordinary host page ────────────────────────────────────────
  await navigate('/test-host/');
  await openFeature();
  await waitFor(() => evaluate(`Boolean(${cardFor('chart.png')})`), 'chart card');

  results.widgetOwnInterface = await evaluate(`(()=>{
    const host=document.querySelector('[data-a11ytb-host]');
    const hostImages=Array.from(document.images).map(i=>i.currentSrc||i.src);
    const cards=Array.from(${ROOT}.querySelectorAll('.a11ytb-alt-card'));
    const previews=cards.map(c=>c.querySelector('.a11ytb-alt-card__preview')?.src);
    return { lightDomImagesInWidget: host.querySelectorAll('img').length,
      cards: cards.length, previews,
      allPreviewsAreHostImages: previews.every(src=>hostImages.includes(src)),
      shadowImages: ${ROOT}.querySelectorAll('img').length };
  })()`);
  assert.equal(results.widgetOwnInterface.lightDomImagesInWidget, 0);
  assert.ok(results.widgetOwnInterface.cards > 0);
  assert.equal(results.widgetOwnInterface.allPreviewsAreHostImages, true,
    JSON.stringify(results.widgetOwnInterface.previews));
  // The panel's own example images live in the shadow root and are never findings.
  assert.ok(results.widgetOwnInterface.shadowImages > results.widgetOwnInterface.cards);

  assert.equal(await evaluate(`Boolean(${cardFor('decorative.png')})`), false,
    'a small alt="" image is decorative, not an error');
  assert.equal(await evaluate(`document.getElementById('existing').getAttribute('alt')`),
    'Four blue bars rise from Q1 to Q4');
  assert.equal(await evaluate(`Boolean(${cardFor('chart.png')}) && ${cardFor('chart.png')}.textContent.includes('Four blue bars')`),
    false, 'an image with meaningful alt text is not offered for replacement');

  // 7: the deferred image is not rendered before it loads, so the first scan cannot see it.
  const lazyBefore = await evaluate(`(()=>{const i=document.getElementById('lazy-image');
    return { complete: i.complete, width: i.getBoundingClientRect().width, card: Boolean(${cardFor('deferred.png')}) }})()`);
  assert.equal(lazyBefore.card, false, 'an unrendered lazy image cannot be reported yet');
  await evaluate(`document.getElementById('deferred').scrollIntoView()`);
  await waitFor(() => evaluate(`document.getElementById('lazy-image').complete && document.getElementById('lazy-image').naturalWidth>0`), 'lazy image load');
  await waitFor(() => evaluate(`Boolean(${cardFor('deferred.png')})`), 'lazy image reported after it loads');
  results.lazyImage = { ...lazyBefore, reportedAfterLoad: true };

  // 4: an SVG source is a real limitation of an image-understanding model.
  const vectorCard = cardFor('vector.svg');
  await evaluate(`(${vectorCard}).querySelector('input[type=checkbox]').click()`);
  assert.equal(await clickIn(vectorCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${vectorCard}).textContent.includes('Only PNG, JPEG, and WebP images are supported')`), 'unsupported format message');
  assert.equal(await evaluate(`(${vectorCard}).querySelector('textarea').value`), '');
  assert.equal(await evaluate(`Array.from((${vectorCard}).querySelectorAll('button')).find(b=>b.textContent.trim()==='Generate Alt Text').disabled`), false);
  results.unsupportedFormat = true;

  // 5 + 6: a failing request is reported, retrying works, and the request shape is verified.
  const chartCard = cardFor('chart.png');
  await evaluate(`(${chartCard}).querySelector('input[type=checkbox]').click()`);
  blockGenerate = true;
  assert.equal(await clickIn(chartCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${chartCard}).textContent.includes('Operation failed; retry is available.')`), 'network failure state');
  assert.equal(await evaluate(`(${chartCard}).querySelector('textarea').value`), '', 'no suggestion appears after a failed request');
  assert.equal(await evaluate(`document.getElementById('informative') === undefined || !document.getElementById('informative').hasAttribute('alt')`), true);
  blockGenerate = false;
  assert.equal(await clickIn(chartCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${chartCard}).querySelector('textarea').value.length>0`), 'suggestion after retry');
  const request = generateRequests.find((entry) => entry.body);
  results.requestShape = { count: generateRequests.length, url: request?.url,
    siteId: request?.body?.siteId, mimeType: request?.body?.mimeType,
    imageHashLength: request?.body?.imageHash?.length,
    dataPrefix: request?.body?.data?.slice(0, 12),
    context: request?.body?.context };
  assert.match(request.url, /\/api\/assistaccess\/alt-text\/generate$/);
  assert.equal(request.body.siteId, 'test');
  assert.equal(request.body.mimeType, 'image/png');
  assert.equal(request.body.imageHash.length, 64);
  assert.match(request.body.data, /^[A-Za-z0-9+/]+={0,2}$/);
  assert.equal(request.body.context.caption, 'Quarterly sales increased from Q1 to Q4.');

  // 8: one dynamic image is one finding, even after several widget-driven DOM updates.
  await evaluate(`document.getElementById('add-image').click()`);
  await waitFor(() => evaluate(`Boolean(document.getElementById('dynamic-image'))`), 'dynamic image');
  await waitFor(() => evaluate(`Boolean(${cardFor('dynamic.png')})`), 'dynamic image card');
  const dynamicCards = await evaluate(`Array.from(${ROOT}.querySelectorAll('.a11ytb-alt-card')).filter(c=>c.querySelector('img')?.src.includes('dynamic.png')).length`);
  assert.equal(dynamicCards, 1);
  await evaluate(`(()=>{const b=Array.from(${ROOT}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent===${FEATURE});
    b.click();b.click();b.click()})()`);
  await sleep(1600);
  assert.equal(await evaluate(`Array.from(${ROOT}.querySelectorAll('.a11ytb-alt-card')).filter(c=>c.querySelector('img')?.src.includes('dynamic.png')).length`), 1,
    'widget-driven updates must not duplicate findings');
  results.dynamicImage = { cards: 1, stable: true };

  const dynamicCard = cardFor('dynamic.png');
  await typeInto(dynamicCard, 'New arrival badge');
  assert.equal(await clickIn(dynamicCard, 'Apply Alt'), true);
  await waitFor(() => evaluate(`document.getElementById('dynamic-image').getAttribute('alt')==='New arrival badge'`), 'alt applied to the dynamic host image');
  // 11: the result is announced through the shared live region in the host document.
  const announced = await waitFor(() => evaluate(`(()=>{const r=document.getElementById('a11ytb-live-polite');
    return r && /Alternative text applied to the page image/.test(r.textContent) ? {text:r.textContent,role:r.getAttribute('role'),live:r.getAttribute('aria-live'),atomic:r.getAttribute('aria-atomic')} : null})()`),
  'apply announcement');
  results.announcement = announced;
  assert.equal(announced.role, 'status');
  assert.equal(announced.live, 'polite');
  results.dynamicApply = await evaluate(`({alt:document.getElementById('dynamic-image').getAttribute('alt'),src:document.getElementById('dynamic-image').getAttribute('src')})`);

  // ── 9: no service configured at all ─────────────────────────────────────────
  await navigate('/test-host/no-ai.html');
  await openFeature();
  await waitFor(() => evaluate(`Boolean(${cardFor('chart.png')})`), 'unconfigured card');
  const noAiCard = cardFor('chart.png');
  await waitFor(() => evaluate(`(${noAiCard}).textContent.includes('AI suggestions are unavailable until this site configures its authorized server endpoint.')`), 'unconfigured message');
  assert.equal(await evaluate(`Array.from((${noAiCard}).querySelectorAll('button')).find(b=>b.textContent.trim()==='Generate Alt Text').disabled`), true);
  assert.deepEqual(await evaluate(`(()=>Array.from((${noAiCard}).querySelectorAll('input[type=checkbox]')).map(c=>c.className))()`),
    ['a11ytb-alt-card__decorative-confirm'], 'no consent is requested when nothing can be sent');
  await typeInto(noAiCard, 'Bar chart of quarterly sales');
  assert.equal(await clickIn(noAiCard, 'Apply Alt'), true);
  await waitFor(() => evaluate(`document.getElementById('unconfigured-image').getAttribute('alt')==='Bar chart of quarterly sales'`), 'manual edit without any AI service');
  results.withoutService = await evaluate(`({alt:document.getElementById('unconfigured-image').getAttribute('alt'),src:document.getElementById('unconfigured-image').getAttribute('src')})`);

  // ── 10: the server has no provider for this tenant ──────────────────────────
  await navigate('/test-host/no-provider.html');
  await openFeature();
  await waitFor(() => evaluate(`Boolean(${cardFor('chart.png')})`), 'providerless card');
  const providerlessCard = cardFor('chart.png');
  await evaluate(`(${providerlessCard}).querySelector('input[type=checkbox]').click()`);
  const before = generateRequests.length;
  assert.equal(await clickIn(providerlessCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${providerlessCard}).textContent.includes('AI suggestions are not configured for this site.')`), 'configuration error from the server');
  assert.ok(generateRequests.length > before, 'the request reached the server and was refused there');
  assert.equal(await evaluate(`(${providerlessCard}).querySelector('textarea').value`), '');
  assert.equal(await evaluate(`(${providerlessCard}).textContent.includes('Suggestion ready')`), false);
  results.withoutProvider = { error: 'AI suggestions are not configured for this site.' };

  // ── 12: an image the browser is not allowed to read ──────────────────────────
  await navigate('/test-host/cross-origin.html');
  await openFeature();
  await waitFor(() => evaluate(`Boolean(${cardFor('chart.png')})`), 'cross-origin card');
  const crossCard = cardFor('chart.png');
  await evaluate(`(${crossCard}).querySelector('input[type=checkbox]').click()`);
  const beforeCross = generateRequests.length;
  assert.equal(await clickIn(crossCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${crossCard}).textContent.includes('Operation failed; retry is available.')`), 'cross-origin failure state');
  assert.equal(await evaluate(`(${crossCard}).querySelector('textarea').value`), '');
  assert.equal(generateRequests.length, beforeCross, 'nothing is sent to the service when the image cannot be read');
  results.crossOrigin = await evaluate(`({error:(${crossCard}).textContent.includes('Failed to fetch')
      ? 'Failed to fetch: the browser refused to read the cross-origin image'
      : 'unexpected: no network error was shown',
    reachableToPage: document.getElementById('cross-origin-image').naturalWidth>0})`);
  assert.equal(results.crossOrigin.reachableToPage, true, 'the page can still render the cross-origin image');

  assert.deepEqual(consoleErrors.filter(Boolean), []);
  process.stdout.write(`${JSON.stringify({ result: 'pass', ...results }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ consoleErrors, generateRequests: generateRequests.length }, null, 2)}\n`);
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      const details = await evaluate(`({url:location.href,cards:${ROOT}?.querySelectorAll('.a11ytb-alt-card').length,
        text:Array.from(${ROOT}?.querySelectorAll('.a11ytb-alt-card')||[]).map(c=>c.innerText.slice(0,300))})`);
      process.stderr.write(`${JSON.stringify({ details }, null, 2)}\n`);
    } catch { /* the page may have navigated */ }
  }
  throw error;
} finally {
  socket?.close();
  chrome.kill();
  await new Promise((done) => corsless.close(done));
  if (resolve(profile).startsWith(`${tempRoot}${sep}`)) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
