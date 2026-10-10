/**
 * DOM scope helpers.
 *
 * Everything that reads or writes the host document asks these functions first:
 * "is this node ours?", "is it inside the scope we were told to work on?", "is it
 * visible?" — so that no feature has to re-implement (and get wrong) the answers.
 */

import { DATA_ATTRS } from '../../constants.js';

export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Resolve "the website content" for content-scoped work.
 * Order: explicit selector → <main> → [role=main] → common app roots → <body>.
 * @param {string|null} selector
 * @returns {Element|null}
 */
export function resolveContentRoot(selector) {
  if (!isBrowser()) return null;
  if (selector) {
    const explicit = document.querySelector(selector);
    if (explicit) return explicit;
  }
  const candidates = ['main', '[role="main"]', '#root', '#app', '#__next', '#content'];
  for (const candidate of candidates) {
    const element = document.querySelector(candidate);
    if (element) return element;
  }
  return document.body || document.documentElement;
}

/**
 * Work out which element a filter/override should be applied to.
 *
 * 'document'    → <html>. A filter on the document root element does not create
 *                 a containing block for fixed/absolute descendants (Filter
 *                 Effects spec), so teammates' fixed modals keep working. This is
 *                 the safe default.
 * 'contentRoot' → an explicit content element. Opt-in only: filtering a non-root
 *                 element *does* create a containing block, which can break
 *                 position:fixed descendants inside that subtree.
 *
 * @param {{settingTarget?: string, forcedTarget?: string, contentRootSelector?: string|null}} options
 */
export function resolveTargetRoot(options = {}) {
  if (!isBrowser()) return null;
  const { settingTarget = 'document', forcedTarget = 'auto', contentRootSelector = null } = options;
  const target = forcedTarget && forcedTarget !== 'auto' ? forcedTarget : settingTarget;
  if (target === 'contentRoot') return resolveContentRoot(contentRootSelector);
  return document.documentElement;
}

/** True when the node lives inside the toolbar's own UI (light or shadow). */
export function isOwnedByToolbar(node) {
  if (!node) return false;
  const element = node.nodeType === 1 ? node : node.parentElement;
  if (!element) return false;
  const rootNode = typeof element.getRootNode === 'function' ? element.getRootNode() : null;
  if (rootNode && rootNode.host) {
    return typeof rootNode.host.matches === 'function'
      ? rootNode.host.matches(`[${DATA_ATTRS.HOST}]`)
      : false;
  }
  return typeof element.closest === 'function'
    ? element.closest(`[${DATA_ATTRS.HOST}]`) !== null
    : false;
}

/** True when the element belongs to the subtree a feature is scoped to. */
export function isInScope(element, root) {
  if (!element || !root) return false;
  if (element === root) return true;
  if (typeof root.contains !== 'function') return false;
  return root.contains(element);
}

/**
 * Visible enough to matter for flashing detection: rendered box, not hidden by
 * visibility/display and not fully transparent.
 */
export function isElementVisible(element) {
  if (!element || !isBrowser()) return false;
  if (element.hasAttribute && element.hasAttribute('hidden')) return false;
  if (typeof element.getBoundingClientRect !== 'function') return false;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return false;
  const view = element.ownerDocument && element.ownerDocument.defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') return true;
  const style = view.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  if (Number.parseFloat(style.opacity) === 0) return false;
  return true;
}

export function elementAreaPx(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return 0;
  const rect = element.getBoundingClientRect();
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

export function viewportAreaPx() {
  if (!isBrowser()) return 0;
  const width = window.innerWidth || 0;
  const height = window.innerHeight || 0;
  return Math.max(1, width * height);
}

/**
 * Best-effort stable key for an element, used for the per-page allowlist and for
 * de-duplicating findings across rescans.
 *
 * It is intentionally shape-based (tag/id/class/nth-of-type/src) rather than
 * positional-only, so it survives unrelated insertions earlier in the DOM. It is
 * still an approximation: a framework that regenerates classes between renders
 * produces a new key, and a new element can reuse an old key.
 */
export function elementKey(element) {
  if (!element || element.nodeType !== 1) return 'unknown';
  const parts = [];
  let node = element;
  let depth = 0;
  while (node && node.nodeType === 1 && depth < 6) {
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : '';
    let classes = '';
    if (!id && node.classList && node.classList.length) {
      classes = `.${Array.from(node.classList).slice(0, 2).join('.')}`;
    }
    let index = '';
    if (node.parentElement && !id) {
      const sameTag = Array.from(node.parentElement.children).filter(
        (sibling) => sibling.tagName === node.tagName,
      );
      if (sameTag.length > 1) index = `:nth-of-type(${sameTag.indexOf(node) + 1})`;
    }
    const src = node.getAttribute ? node.getAttribute('src') || '' : '';
    const srcPart = src ? `[${src.slice(0, 60)}]` : '';
    parts.unshift(`${tag}${id}${classes}${index}${srcPart}`);
    node = node.parentElement;
    depth += 1;
  }
  return parts.join('>').slice(0, 300) || 'unknown';
}

/** Short human-readable description of an element, for the findings list. */
export function describeElement(element) {
  if (!element || element.nodeType !== 1) return '';
  const attribute = (name) => (element.getAttribute ? element.getAttribute(name) : null);
  const label = attribute('aria-label') || attribute('alt') || attribute('title');
  if (label && label.trim()) return label.trim().slice(0, 60);
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 60);
  const src = attribute('src');
  if (src) {
    const file = src.split('/').pop().split('?')[0];
    if (file) return `${element.tagName.toLowerCase()} ${file}`.slice(0, 60);
  }
  const id = element.id ? `#${element.id}` : '';
  const className =
    element.classList && element.classList.length ? `.${element.classList[0]}` : '';
  return `${element.tagName.toLowerCase()}${id}${className}`;
}

/** True when the element (or an ancestor) opted out of toolbar scanning. */
export function isExcludedFromScanning(element) {
  if (!element) return true;
  if (typeof element.closest !== 'function') return false;
  return element.closest(`[${DATA_ATTRS.EXCLUDE}]`) !== null;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable="true"]',
  '[tabindex]',
].join(', ');

/**
 * True when the element is focusable by nature (before checking disabled/hidden).
 * Used to decide whether the audit may offer a "move focus there" action: the
 * toolbar never makes a non-focusable element focusable, because adding tabindex
 * to a page element changes its behaviour.
 */
export function isNaturallyFocusable(element) {
  if (!element || typeof element.matches !== 'function') return false;
  if (element.matches(FOCUSABLE_SELECTOR) !== true) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1' && element.matches('[tabindex]')) {
    return element.matches('a[href], button, input, select, textarea, iframe, audio[controls], video[controls], [contenteditable="true"]');
  }
  return true;
}

/** Focusable *and* currently visible — the audit only offers focus on those. */
export function isTabbable(element) {
  return isNaturallyFocusable(element) && isElementVisible(element);
}
