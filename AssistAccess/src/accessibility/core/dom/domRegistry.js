/**
 * A single MutationObserver for the whole module.
 *
 * Features subscribe instead of creating their own observers, which keeps the
 * mutation cost predictable on large pages and guarantees that unmounting the
 * toolbar stops every watcher.
 */

import { isOwnedByToolbar } from './domScope.js';

const WATCHED_ATTRIBUTES = ['src', 'srcset', 'alt', 'style', 'class', 'autoplay', 'loop', 'hidden'];

/**
 * @param {object} options
 * @param {Element|Document} [options.root]
 * @param {() => void} options.onChange called after a debounced batch of changes
 * @param {number} [options.debounceMs]
 */
export function createDomRegistry({ root, onChange, debounceMs = 200 } = {}) {
  const target = root || (typeof document !== 'undefined' ? document.documentElement : null);
  let observer = null;
  let timer = null;
  let pending = false;
  let running = false;

  function flush() {
    timer = null;
    if (!pending) return;
    pending = false;
    if (typeof onChange === 'function') onChange();
  }

  function schedule() {
    pending = true;
    if (timer !== null) return;
    timer = setTimeout(flush, debounceMs);
  }

  function handleRecords(records) {
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      if (isOwnedByToolbar(record.target)) continue;
      if (record.type === 'attributes') {
        const name = record.attributeName || '';
        if (!WATCHED_ATTRIBUTES.includes(name)) continue;
      }
      schedule();
      return;
    }
  }

  function start() {
    if (running || !target || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver(handleRecords);
    observer.observe(target, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    });
    running = true;
  }

  function stop() {
    if (observer) {
      observer.takeRecords();
      observer.disconnect();
    }
    observer = null;
    running = false;
    pending = false;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    start,
    stop,
    /** Run the callback now, ignoring the debounce timer. */
    flushNow() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = true;
      flush();
    },
    isRunning: () => running,
  };
}

/**
 * Shared observer for the whole module.
 *
 * The page audit, the route announcer and any other reader feature subscribe here
 * instead of creating their own MutationObserver, so the module keeps a single
 * subtree observer no matter how many features are enabled. The observer is
 * created with the first subscriber and disconnected with the last one.
 *
 * @param {() => void} callback
 * @param {{debounceMs?: number}} [options]
 * @returns {() => void} unsubscribe
 */
const sharedSubscribers = new Set();
let sharedRegistry = null;

export function subscribeToDomChanges(callback, options = {}) {
  if (typeof document === 'undefined' || typeof callback !== 'function') return () => {};

  if (!sharedRegistry) {
    sharedRegistry = createDomRegistry({
      debounceMs: options.debounceMs || 400,
      onChange: () => {
        Array.from(sharedSubscribers).forEach((subscriber) => {
          try {
            subscriber();
          } catch (error) {
            /* one failing subscriber must not stop the others */
          }
        });
      },
    });
    sharedRegistry.start();
  }

  sharedSubscribers.add(callback);
  let released = false;

  return () => {
    if (released) return;
    released = true;
    sharedSubscribers.delete(callback);
    if (sharedSubscribers.size === 0 && sharedRegistry) {
      sharedRegistry.stop();
      sharedRegistry = null;
    }
  };
}

/** True while the shared observer is running (used by tests and diagnostics). */
export function hasSharedObserver() {
  return sharedRegistry !== null;
}
