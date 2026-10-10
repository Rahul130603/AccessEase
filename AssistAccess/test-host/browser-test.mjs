import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempRoot = resolve(tmpdir());
const profile = await mkdtemp(join(tempRoot, 'assistaccess-alt-browser-'));
const port = 9300 + Math.floor(Math.random() * 1000);
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'],
{ stdio: 'ignore', windowsHide: true });
let socket;
let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(fn, label, timeout = 15000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try { const value = await fn(); if (value) return value; } catch { /* transient */ }
    await sleep(120);
  }
  throw new Error(`Timed out waiting for ${label}`);
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

const root = `document.querySelector('[data-a11ytb-host]')?.shadowRoot`;
const click = (selector) => evaluate(`(()=>{const el=${root}?.querySelector(${JSON.stringify(selector)});if(!el) return false;el.click();return true})()`);
const card = `Array.from(${root}?.querySelectorAll('.a11ytb-alt-card')||[]).find(el=>el.querySelector('img')?.src.includes('/chart.png'))`;
const button = (scope, label) => evaluate(`(()=>{const el=Array.from((${scope})?.querySelectorAll('button')||[]).find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!el)return false;el.click();return true})()`);

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
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      const text = message.params.args?.map((arg) => arg.value || arg.description).join(' ') || '';
      if (!text.includes('not-found.png')) consoleErrors.push(text);
    }
  };
  await call('Page.enable'); await call('Runtime.enable');
  await call('Page.navigate', { url: 'http://127.0.0.1:8787/test-host/' });
  await waitFor(() => evaluate(`Boolean(${root}?.querySelector('.a11ytb-launcher'))`), 'widget launcher');
  assert.equal(await evaluate(`document.getElementById('informative').hasAttribute('alt')`), false);
  assert.equal(await click('.a11ytb-launcher'), true);
  await waitFor(() => evaluate(`Boolean(${root}?.querySelector('.a11ytb-widget'))`), 'widget panel');
  const desktopBounds = await evaluate(`(()=>{const r=${root}.querySelector('.a11ytb-widget').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,innerWidth,innerHeight}})()`);
  assert.ok(desktopBounds.left >= -1 && desktopBounds.right <= desktopBounds.innerWidth + 1, JSON.stringify(desktopBounds));
  await evaluate(`(()=>{let b=Array.from(${root}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text');b.click()})()`);
  await waitFor(() => evaluate(`Array.from(${root}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text')?.getAttribute('aria-expanded')==='true'`), 'expanded alt section');
  await waitFor(() => evaluate(`Boolean(${card})`), 'informative image card');
  const initialCards = await evaluate(`${root}.querySelectorAll('.a11ytb-alt-card').length`);
  assert.ok(initialCards >= 4, `expected at least four cards, found ${initialCards}`);
  assert.equal(await evaluate(`document.getElementById('existing').getAttribute('alt')`), 'Four blue bars rise from Q1 to Q4');
  assert.equal(await evaluate(`document.getElementById('decorative').getAttribute('alt')`), '');

  await evaluate(`(${card}).querySelector('input[type=checkbox]').click()`);
  assert.equal(await button(card, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${card})?.querySelector('textarea')?.value.includes('Four blue bars')`), 'AI suggestion');
  assert.equal(await evaluate(`document.getElementById('informative').hasAttribute('alt')`), false);
  const reviewed = 'Four blue bars show quarterly sales rising from Q1 to Q4';
  await evaluate(`(()=>{const el=(${card}).querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(reviewed)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  assert.equal(await button(card, 'Apply Alt'), true);
  await waitFor(() => evaluate(`document.getElementById('informative').getAttribute('alt')===${JSON.stringify(reviewed)}`), 'real DOM alt update');
  assert.equal(await button(card, 'Undo'), true);
  await waitFor(() => evaluate(`!document.getElementById('informative').hasAttribute('alt')`), 'undo original attribute');
  await evaluate(`(${card}).querySelector('.a11ytb-alt-card__decorative-confirm').click()`);
  assert.equal(await button(card, 'Mark Decorative'), true);
  await waitFor(() => evaluate(`document.getElementById('informative').getAttribute('alt')===''`), 'decorative empty alt');
  assert.equal(await button(card, 'Undo'), true);
  await waitFor(() => evaluate(`!document.getElementById('informative').hasAttribute('alt')`), 'undo decorative');

  const linkedCard = `Array.from(${root}.querySelectorAll('.a11ytb-alt-card')).find(el=>el.querySelector('img')?.src.includes('/contact.png'))`;
  assert.equal(await evaluate(`(${linkedCard}).querySelectorAll('button')[3]?.disabled`), true);
  const brokenCard = `Array.from(${root}.querySelectorAll('.a11ytb-alt-card')).find(el=>el.querySelector('img')?.src.includes('not-found.png'))`;
  await evaluate(`(${brokenCard}).querySelector('input[type=checkbox]').click()`);
  assert.equal(await button(brokenCard, 'Generate Alt Text'), true);
  await waitFor(() => evaluate(`(${brokenCard})?.textContent.includes('Image download failed')`), 'broken-image error');

  // Click the ordinary host page control; the panel may close, but the shared scanner remains active.
  await evaluate(`document.getElementById('add-image').click()`);
  await waitFor(() => evaluate(`Boolean(document.getElementById('dynamic-image'))`), 'dynamic host image');
  if (!await evaluate(`Boolean(${root}?.querySelector('.a11ytb-widget'))`)) await click('.a11ytb-launcher');
  await waitFor(() => evaluate(`Boolean(${root}?.querySelector('.a11ytb-widget'))`), 'reopened panel');
  await evaluate(`(()=>{const el=Array.from(${root}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text');if(el.getAttribute('aria-expanded')==='false')el.click()})()`);
  await waitFor(() => evaluate(`${root}.querySelectorAll('.a11ytb-alt-card').length>${initialCards}`), 'dynamic image finding');

  // Save a verified correction; turn on exact-match auto-apply for the next visit.
  assert.equal(await button(card, 'Apply Alt'), true);
  await waitFor(() => evaluate(`document.getElementById('informative').hasAttribute('alt')`), 'second apply');
  assert.equal(await button(card, 'Save correction'), true);
  await waitFor(() => evaluate(`(${card})?.textContent.includes('Saved correction confirmed')`), 'saved correction');
  await evaluate(`localStorage.setItem('test-auto-apply','1')`);
  await call('Page.reload', { ignoreCache: true });
  await waitFor(() => evaluate(`document.getElementById('informative')?.getAttribute('alt')===${JSON.stringify(reviewed)}`), 'persisted correction restored', 20000);
  assert.equal(await evaluate(`document.getElementById('existing').getAttribute('alt')`), 'Four blue bars rise from Q1 to Q4');

  await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 2, mobile: true });
  await click('.a11ytb-launcher');
  await waitFor(() => evaluate(`Boolean(${root}?.querySelector('.a11ytb-widget'))`), 'mobile panel');
  const bounds = await evaluate(`(()=>{const r=${root}.querySelector('.a11ytb-widget').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,innerWidth,innerHeight}})()`);
  assert.ok(bounds.left >= -1 && bounds.right <= bounds.innerWidth + 1, JSON.stringify(bounds));
  assert.ok(bounds.top >= -1 && bounds.bottom <= bounds.innerHeight + 1, JSON.stringify(bounds));
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor(() => evaluate(`!${root}?.querySelector('.a11ytb-widget')`), 'Escape closes panel');
  await evaluate(`${root}.querySelector('.a11ytb-launcher').focus()`);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor(() => evaluate(`${root}.querySelector('.a11ytb-launcher')?.getAttribute('aria-expanded')==='true'`), 'keyboard launcher activation');
  await evaluate(`Array.from(${root}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text').focus()`);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', text: ' ', unmodifiedText: ' ', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await waitFor(() => evaluate(`Array.from(${root}.querySelectorAll('.a11ytb-disclosure__button')).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text')?.getAttribute('aria-expanded')==='true'`), 'Space expands feature');
  assert.equal(consoleErrors.filter(Boolean).length, 0, consoleErrors.join('\n'));
  process.stdout.write(JSON.stringify({ result: 'pass', initialCards, desktopBounds, mobileBounds: bounds, consoleErrors }, null, 2) + '\n');
} catch (error) {
  process.stderr.write(JSON.stringify({ consoleErrors }, null, 2) + '\n');
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      const details = await evaluate(`({url:location.href,title:document.title,hosts:document.querySelectorAll('[data-a11ytb-host]').length,scripts:Array.from(document.scripts).map(s=>s.src),body:document.body?.textContent?.slice(0,200),panel:Array.from(document.querySelector('[data-a11ytb-host]')?.shadowRoot?.querySelectorAll('.a11ytb-disclosure')||[]).find(x=>x.querySelector('.a11ytb-disclosure__title')?.textContent==='Image alternative text')?.innerText?.slice(0,2500),cards:document.querySelector('[data-a11ytb-host]')?.shadowRoot?.querySelectorAll('.a11ytb-alt-card').length,focus:document.querySelector('[data-a11ytb-host]')?.shadowRoot?.activeElement?.outerHTML?.slice(0,300),launcherExpanded:document.querySelector('[data-a11ytb-host]')?.shadowRoot?.querySelector('.a11ytb-launcher')?.getAttribute('aria-expanded')})`);
      process.stderr.write(JSON.stringify({ details }, null, 2) + '\n');
    } catch { /* browser may have navigated away */ }
  }
  throw error;
} finally {
  socket?.close(); chrome.kill();
  if (resolve(profile).startsWith(`${tempRoot}${sep}`)) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
