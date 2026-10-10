/**
 * Layout audit for the accessibility widget.
 *
 *     npm run audit:layout
 *
 * Drives a real Chromium against the running dev server and measures the widget's shadow
 * DOM instead of guessing from CSS: horizontal overflow, elements escaping the panel, text
 * clipping, control target sizes, left-edge alignment between the panel blocks, typography
 * scale, focus visibility while tabbing, and the scroll behaviour of the panel body.
 *
 * Chrome is expected at the path below (override with CHROME_PATH); `puppeteer-core` does
 * not download a browser. Screenshots land in tools/layout-audit-out/ so a human can look
 * at the same rendering the numbers came from.
 *
 * Exit code is 1 when it finds an issue, so it can gate a layout change.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'layout-audit-out');
const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.AUDIT_URL || 'http://localhost:5173/demo/';
const WIDTHS = [1440, 1024, 768, 390];
const HEIGHT = 900;

/** Runs inside the page: measures the widget's shadow root. */
function measureWidget() {
  const host = document.querySelector('[data-a11ytb-host]');
  const root = host && host.shadowRoot;
  if (!root) return { error: 'no shadow root found — is the widget mounted?' };

  const panel = root.querySelector('.a11ytb-widget') || root.querySelector('.a11ytb-panel');
  if (!panel) return { error: 'panel is not open' };

  const body = root.querySelector('.a11ytb-widget__body') || root.querySelector('.a11ytb-panel__body');
  const launcher = root.querySelector('.a11ytb-launcher');
  // Sample both boxes together, after forcing one style/layout flush, so the anchor
  // check and the reported rects can never disagree.
  void panel.offsetHeight;
  const panelRect = panel.getBoundingClientRect();
  const launcherRect = launcher ? launcher.getBoundingClientRect() : null;
  const issues = [];
  const round = (n) => Math.round(n * 10) / 10;

  const describe = (el) => {
    const cls = typeof el.className === 'string' && el.className ? `.${el.className.split(/\s+/)[0]}` : '';
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
  };

  const all = Array.from(root.querySelectorAll('*')).filter((el) => !el.closest('.a11ytb-code'));

  // 1. Horizontal overflow of the panel and of its scrolling body.
  if (panel.scrollWidth > panel.clientWidth + 1) {
    issues.push({ kind: 'panel-overflow-x', detail: `panel scrollWidth ${panel.scrollWidth} > clientWidth ${panel.clientWidth}` });
  }
  if (body && body.scrollWidth > body.clientWidth + 1) {
    issues.push({ kind: 'body-overflow-x', detail: `body scrollWidth ${body.scrollWidth} > clientWidth ${body.clientWidth}` });
  }

  // 2. Elements escaping the panel's box. Only the panel's own descendants are
  //    considered: the launcher and the full-viewport layer are meant to sit outside it.
  all.forEach((el) => {
    if (!panel.contains(el)) return;
    if (el.closest('svg')) return; // icon internals inherit their button's box
    if (el.closest('.a11ytb-report, .a11ytb-code')) return; // these scroll inside themselves
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > panelRect.right + 0.6 || r.left < panelRect.left - 0.6) {
      issues.push({
        kind: 'escapes-panel',
        el: describe(el),
        detail: `x ${round(r.left)}..${round(r.right)} vs panel ${round(panelRect.left)}..${round(panelRect.right)}`,
      });
    }
  });

  // 2b. The widget must sit against the edge its corner presets ask for.
  const corner = (root.querySelector('[data-corner]') || {}).dataset
    ? root.querySelector('[data-corner]').dataset.corner
    : 'right-middle';
  // 'right-middle' does not end with 'right', so match on the side name, not a suffix.
  const side = corner.includes('right') ? 'right' : corner.includes('left') ? 'left' : null;
  if (launcher && launcherRect && side) {
    const lr = launcherRect;
    const nearRight = lr.right >= window.innerWidth - 24;
    const nearLeft = lr.left <= 24;
    if (side === 'right' && !nearRight) {
      issues.push({
        kind: 'wrong-side',
        el: 'button.a11ytb-launcher',
        detail: `corner="${corner}" expects the launcher at the right edge, found x ${round(lr.left)}..${round(lr.right)} in a ${window.innerWidth}px viewport`,
      });
    }
    if (side === 'left' && !nearLeft) {
      issues.push({
        kind: 'wrong-side',
        el: 'button.a11ytb-launcher',
        detail: `corner="${corner}" expects the launcher at the left edge, found x ${round(lr.left)}..${round(lr.right)}`,
      });
    }
    // The panel belongs beside the launcher, on the content side of it — but only when
    // they share a row. On small screens the launcher moves above the bottom sheet, so
    // there is no horizontal gap to measure.
    const sameRow = !(lr.bottom <= panelRect.top || lr.top >= panelRect.bottom);
    if (sameRow) {
      const gap = side === 'right' ? lr.left - panelRect.right : panelRect.left - lr.right;
      if (gap < 0 || gap > 40) {
        issues.push({
          kind: 'panel-anchor',
          el: 'div.a11ytb-widget',
          detail: `gap between panel and launcher is ${round(gap)}px (expected 0–40)`,
        });
      }
    }
  }

  // 3. Text clipping inside a block that cannot scroll.
  all.forEach((el) => {
    if (!['P', 'SPAN', 'H2', 'H3', 'H4', 'LI', 'LABEL', 'BUTTON', 'DD', 'DT'].includes(el.tagName)) return;
    if (el.classList.contains('a11ytb-visually-hidden-inline')) return; // clipped by design
    if (el.closest('.a11ytb-visually-hidden-inline')) return;
    const style = getComputedStyle(el);
    if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.textOverflow === 'ellipsis') return;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      issues.push({ kind: 'text-clipped', el: describe(el), detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}` });
    }
  });

  // 4. Control target sizes (WCAG 2.5.8 floor is 24×24 CSS px). An input wrapped in a
  //    label is hit through the label, so that is the target that gets measured.
  root.querySelectorAll('button, input, select, textarea, a[href], [tabindex]').forEach((el) => {
    const target = el.closest('label') || el;
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.width < 24 || r.height < 24) {
      issues.push({
        kind: 'small-target',
        el: describe(el),
        detail: `${round(r.width)}×${round(r.height)}${target === el ? '' : ' (through its label)'}`,
      });
    }
  });

  // 5. Left-edge alignment of the panel's blocks (they should share one inset grid).
  const groups = {
    'panel body padding': ['.a11ytb-widget__body', '.a11ytb-panel__body'],
    'quick block': ['.a11ytb-quick'],
    'quick heading': ['.a11ytb-quick__heading'],
    'category heading': ['.a11ytb-category__heading'],
    'category description': ['.a11ytb-category__description'],
    'feature button': ['.a11ytb-disclosure__button'],
    'feature title': ['.a11ytb-disclosure__title'],
    'feature description': ['.a11ytb-disclosure__summary'],
    'audit block': ['.a11ytb-audit-summary'],
    'finding card': ['.a11ytb-finding'],
  };
  const leftEdges = {};
  const textLeftEdges = {};
  Object.entries(groups).forEach(([label, selectors]) => {
    const values = new Set();
    const contentValues = new Set();
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => {
        const r = el.getBoundingClientRect();
        values.add(round(r.left));
        // For containers, also record where their text starts.
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = range.getClientRects();
        if (rects.length) contentValues.add(round(rects[0].left));
      });
    });
    if (values.size) leftEdges[label] = Array.from(values).sort((a, b) => a - b);
    if (contentValues.size) textLeftEdges[label] = Array.from(contentValues).sort((a, b) => a - b);
  });

  // Text that should share a left edge: feature title, its description, and the panel's
  // other body text. Any mismatch here is the "ragged left edge" class of bug.
  const titleLeft = textLeftEdges['feature title'] || [];
  const descriptionLeft = textLeftEdges['feature description'] || [];
  const quickHeadingLeft = textLeftEdges['quick heading'] || [];
  const categoryLeft = textLeftEdges['category heading'] || [];

  // 6. Typography scale of the heading levels.
  const fontSizes = {};
  const fontOf = (label, selector) => {
    const el = root.querySelector(selector);
    if (!el) return;
    const style = getComputedStyle(el);
    fontSizes[label] = `${style.fontSize} / ${style.lineHeight} / ${style.fontWeight}`;
  };
  fontOf('panel title (h2)', '.a11ytb-widget__title, .a11ytb-panel__title');
  fontOf('category heading (h3)', '.a11ytb-category__heading');
  fontOf('quick heading (h3)', '.a11ytb-quick__heading');
  fontOf('feature title (h4 button)', '.a11ytb-disclosure__button');
  fontOf('feature description', '.a11ytb-disclosure__summary');
  fontOf('hint', '.a11ytb-hint');
  fontOf('finding label', '.a11ytb-finding__label');

  // 7. Vertical rhythm between the panel's top-level blocks.
  const blockGaps = [];
  const topLevel = Array.from(body ? body.children : []).filter((el) => el.getBoundingClientRect().height > 0);
  for (let i = 1; i < topLevel.length; i += 1) {
    const previous = topLevel[i - 1].getBoundingClientRect();
    const current = topLevel[i].getBoundingClientRect();
    blockGaps.push({ after: describe(topLevel[i - 1]), gap: round(current.top - previous.bottom) });
  }

  // 8. Control sizes inside the panel (consistency).
  const controlSizes = {};
  ['.a11ytb-quick__profile', '.a11ytb-slider', '.a11ytb-select', '.a11ytb-widget__close', '.a11ytb-launcher--circle', '.a11ytb-form__control', '.a11ytb-report'].forEach((selector) => {
    const el = root.querySelector(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    controlSizes[selector] = `${round(r.width)}×${round(r.height)} border=${style.borderWidth} font=${style.fontSize}`;
  });

  // 9. Scroll behaviour: the body should scroll, the page behind should not move.
  const scroll = body
    ? {
        bodyScrollable: body.scrollHeight > body.clientHeight + 1,
        bodyScrollHeight: body.scrollHeight,
        bodyClientHeight: body.clientHeight,
        overflowY: getComputedStyle(body).overflowY,
      }
    : null;

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    panel: { x: round(panelRect.left), y: round(panelRect.top), w: round(panelRect.width), h: round(panelRect.height) },
    launcherRect: launcherRect
      ? { x: round(launcherRect.left), right: round(launcherRect.right) }
      : null,
    corner,
    issues,
    leftEdges,
    textLeftEdges,
    alignment: {
      featureTitleVsDescription: titleLeft.length && descriptionLeft.length ? round(descriptionLeft[0] - titleLeft[0]) : null,
      quickHeadingVsFeatureTitle: quickHeadingLeft.length && titleLeft.length ? round(quickHeadingLeft[0] - titleLeft[0]) : null,
      categoryVsFeatureTitle: categoryLeft.length && titleLeft.length ? round(categoryLeft[0] - titleLeft[0]) : null,
    },
    fontSizes,
    blockGaps,
    controlSizes,
    scroll,
  };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  defaultViewport: { width: WIDTHS[0], height: HEIGHT },
});

mkdirSync(OUT_DIR, { recursive: true });
const report = { url: URL, chrome: CHROME, runs: [] };
let issueCount = 0;

try {
  const page = await browser.newPage();
  // Be explicit about the colour scheme: headless Chrome otherwise defaults to dark,
  // which makes the widget render in its dark palette and hides light-mode defects.
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('[data-a11ytb-host]', { timeout: 15000 });

  // Open the widget through its own launcher, as a user would.
  await page.evaluate(() => {
    const host = document.querySelector('[data-a11ytb-host]');
    const launcher = host && host.shadowRoot && host.shadowRoot.querySelector('.a11ytb-launcher');
    if (launcher) launcher.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Expand every disclosure so nested panels and their contents are laid out too.
  await page.evaluate(() => {
    const host = document.querySelector('[data-a11ytb-host]');
    const root = host && host.shadowRoot;
    if (!root) return;
    root.querySelectorAll('.a11ytb-disclosure__button[aria-expanded="false"]').forEach((button) => button.click());
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  for (const width of WIDTHS) {
    await page.setViewport({ width, height: HEIGHT });
    await new Promise((resolve) => setTimeout(resolve, 400));

    const measurements = await page.evaluate(measureWidget);
    const screenshot = join(OUT_DIR, `widget-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    report.runs.push({ width, measurements, screenshot: screenshot.replace(HERE, 'tools') });
    if (measurements.error) issueCount += 1;
    issueCount += (measurements.issues || []).length;
  }

  // Focus visibility: tab through the panel and check every focused control has an outline.
  await page.setViewport({ width: WIDTHS[0], height: HEIGHT });
  await page.evaluate(() => {
    const host = document.querySelector('[data-a11ytb-host]');
    const root = host && host.shadowRoot;
    const panel = root && (root.querySelector('.a11ytb-widget') || root.querySelector('.a11ytb-panel'));
    if (panel) panel.focus();
  });
  const focusReport = [];
  for (let step = 0; step < 25; step += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const host = document.querySelector('[data-a11ytb-host]');
      const root = host && host.shadowRoot;
      if (!root) return null;
      const active = root.activeElement || document.activeElement;
      if (!active || active === root) return null;
      const style = getComputedStyle(active);
      return {
        tag: active.tagName.toLowerCase(),
        cls: typeof active.className === 'string' ? active.className.split(/\s+/)[0] : '',
        name: (active.getAttribute('aria-label') || active.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        visible: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 1,
      };
    });
    if (info) focusReport.push(info);
  }
  report.focus = {
    steps: focusReport.length,
    withoutOutline: focusReport.filter((entry) => !entry.visible),
  };
  issueCount += report.focus.withoutOutline.length;
  if (report.focus.steps === 0) issueCount += 1;

  // axe-core over the widget's shadow tree: contrast, names, roles, ARIA usage.
  await page.evaluate(() => {
    const host = document.querySelector('[data-a11ytb-host]');
    const root = host && host.shadowRoot;
    if (!root) return;
    // Collapse again: axe over 27,000px of expanded panels is slow and redundant.
    root.querySelectorAll('.a11ytb-disclosure__button[aria-expanded="true"]').forEach((button) => button.click());
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  try {
    const axeSource = readFileSync(
      join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
      'utf8',
    );
    await page.addScriptTag({ content: axeSource });
    const runAxe = () =>
      page.evaluate(async () => {
        const host = document.querySelector('[data-a11ytb-host]');
        if (!window.axe || !host) return { error: 'axe unavailable' };
        const results = await window.axe.run(host, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        });
        return {
          violations: results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            count: violation.nodes.length,
            targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
          })),
          passes: results.passes.length,
        };
      });

    report.axe = await runAxe();
    // Contrast behaves differently per colour scheme, so check both.
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await new Promise((resolve) => setTimeout(resolve, 300));
    report.axeDark = await runAxe();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  } catch (error) {
    report.axe = { error: String(error && error.message ? error.message : error) };
  }
  [report.axe, report.axeDark].forEach((result) => {
    if (!result || result.error) issueCount += 1;
    if (result && Array.isArray(result.violations)) {
      issueCount += result.violations.reduce((sum, violation) => sum + violation.count, 0);
    }
  });
} finally {
  await browser.close();
}

writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`layout audit: ${report.runs.length} viewport(s), ${issueCount} finding(s)`);
console.log(`screenshots and report.json in tools/layout-audit-out/\n`);
report.runs.forEach((run) => {
  const { measurements } = run;
  if (measurements.error) {
    console.log(`── ${run.width}px: ${measurements.error}`);
    return;
  }
  console.log(`── ${run.width}px  panel ${measurements.panel.w}×${measurements.panel.h} at x=${measurements.panel.x}`);
  console.log(`   issues: ${measurements.issues.length}`);
  measurements.issues.slice(0, 12).forEach((issue) => {
    console.log(`     ✗ [${issue.kind}] ${issue.el ? `${issue.el} — ` : ''}${issue.detail}`);
  });
  if (measurements.issues.length > 12) console.log(`     … ${measurements.issues.length - 12} more`);
  console.log(`   alignment (px offset from feature title): ${JSON.stringify(measurements.alignment)}`);
  console.log(`   font sizes: ${JSON.stringify(measurements.fontSizes)}`);
  console.log(`   controls: ${JSON.stringify(measurements.controlSizes)}`);
  console.log(`   scroll: ${JSON.stringify(measurements.scroll)}`);
});

if (report.focus) {
  console.log(`\n── keyboard focus: ${report.focus.steps} stops, ${report.focus.withoutOutline.length} without a visible outline`);
  report.focus.withoutOutline.slice(0, 8).forEach((entry) => {
    console.log(`     ✗ ${entry.tag}.${entry.cls} "${entry.name}" → ${entry.outline}`);
  });
}

if (report.axe || report.axeDark) {
  [
    ['light', report.axe],
    ['dark', report.axeDark],
  ].forEach(([scheme, result]) => {
    if (!result) return;
    if (result.error) {
      console.log(`\n── axe-core (${scheme}): could not run (${result.error})`);
      return;
    }
    const total = result.violations.reduce((sum, violation) => sum + violation.count, 0);
    console.log(
      `\n── axe-core (${scheme}, widget only): ${result.violations.length} rule(s), ${total} node(s), ${result.passes} checks passed`,
    );
    result.violations.forEach((violation) => {
      console.log(`     ✗ [${violation.impact}] ${violation.id} ×${violation.count} — ${violation.help}`);
      violation.targets.forEach((target) => console.log(`         ${target}`));
    });
  });
}

process.exit(issueCount > 0 ? 1 : 0);
