/**
 * The only place in the module that writes to the host document outside React.
 *
 * Two rules make the module safe to drop into a shared project:
 *  1. Everything injected carries a namespaced id, so it can be inspected and
 *     removed without guesswork ("one writer per global side effect").
 *  2. Attributes added to page elements remember their previous value, so
 *     teardown restores the page exactly — including "the attribute was absent".
 */

import { isBrowser } from './domScope.js';

/** element → Map(attributeName → original value or null when it was absent). */
const tracked = new Map();
/** id → { element: HTMLStyleElement, count: number } */
const styleRefs = new Map();

let toolbarHost = null;

function untrack(element) {
  const attributes = tracked.get(element);
  if (!attributes) return;
  if (attributes.size === 0) tracked.delete(element);
}

/**
 * Add a namespaced attribute, remembering how to undo it.
 * @param {Element} element
 * @param {string} name full attribute name, e.g. 'data-a11ytb-flash-paused'
 * @param {string} [value]
 */
export function markAttribute(element, name, value = '1') {
  if (!element || element.nodeType !== 1) return;
  let attributes = tracked.get(element);
  if (!attributes) {
    attributes = new Map();
    tracked.set(element, attributes);
  }
  if (!attributes.has(name)) {
    attributes.set(name, element.hasAttribute(name) ? element.getAttribute(name) : null);
  }
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** Undo a single marked attribute and forget it. */
export function unmarkAttribute(element, name) {
  if (!element || element.nodeType !== 1) return;
  const attributes = tracked.get(element);
  if (!attributes || !attributes.has(name)) return;
  const original = attributes.get(name);
  if (original === null) element.removeAttribute(name);
  else element.setAttribute(name, original);
  attributes.delete(name);
  untrack(element);
}

/** True when this module currently owns the given attribute on the element. */
export function isMarked(element, name) {
  const attributes = element && tracked.get(element);
  return Boolean(attributes && attributes.has(name));
}

/** Restore every attribute this module added, and drop detached elements. */
export function unmarkAll() {
  Array.from(tracked.keys()).forEach((element) => {
    const attributes = tracked.get(element);
    if (!element.isConnected) {
      tracked.delete(element);
      return;
    }
    Array.from(attributes.keys()).forEach((name) => unmarkAttribute(element, name));
  });
  tracked.clear();
}

export function getTrackedElementCount() {
  return tracked.size;
}

/**
 * Create, update or remove a <style> element we own.
 * @param {string} id
 * @param {string} css empty/whitespace removes the element
 */
export function setStyleText(id, css) {
  if (!isBrowser()) return;
  const existing = document.getElementById(id);
  if (!css || !css.trim()) {
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    return;
  }
  const element = existing || document.createElement('style');
  if (!existing) {
    element.id = id;
    element.setAttribute('data-a11ytb-injected', '');
    (document.head || document.documentElement).appendChild(element);
  }
  if (element.textContent !== css) element.textContent = css;
}

export function removeStyle(id) {
  if (!isBrowser()) return;
  const existing = document.getElementById(id);
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}

/** Remove every <style> element this module created. */
export function removeAllStyles() {
  if (!isBrowser()) return;
  Array.from(document.querySelectorAll('style[data-a11ytb-injected]')).forEach((element) => {
    if (element.parentNode) element.parentNode.removeChild(element);
  });
}

/**
 * Reference-counted style injection for app-owned components (the safe motion
 * pattern). The stylesheet is namespaced (.a11ytb-safe-motion) and removed once
 * the last consumer unmounts.
 * @returns {() => void} release function
 */
export function acquireStyle(id, css) {
  if (!isBrowser()) return () => {};
  const entry = styleRefs.get(id);
  if (entry) {
    entry.count += 1;
  } else {
    setStyleText(id, css);
    styleRefs.set(id, { count: 1 });
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = styleRefs.get(id);
    if (!current) return;
    current.count -= 1;
    if (current.count <= 0) {
      styleRefs.delete(id);
      removeStyle(id);
    }
  };
}

/** Remember the toolbar's shadow host so appliers can exclude/counter-adjust it. */
export function setToolbarHost(element) {
  toolbarHost = element || null;
}

export function getToolbarHost() {
  return toolbarHost;
}
