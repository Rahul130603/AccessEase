/**
 * Development-only diagnostics for the app-owned pattern components.
 *
 * These warnings exist so a developer sees the problem in the console at the point
 * where the markup is written, instead of discovering it in an audit later. They
 * are silent in production builds: a console message is a developer tool, not a
 * user-facing safeguard.
 */

const isDevelopment =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

const seen = new Set();

/**
 * @param {string} key dedupe key, so a warning is not repeated on every render
 * @param {string} message
 */
export function warnDev(key, message) {
  if (!isDevelopment || typeof console === 'undefined' || !console.warn) return;
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(`[accessibility] ${message}`);
}

/** Test helper: clears the dedupe set. */
export function resetWarnDevCache() {
  seen.clear();
}

export { isDevelopment };
