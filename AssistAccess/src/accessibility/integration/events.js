/**
 * window CustomEvent bridge.
 *
 * Non-React parts of the team toolbar (and plain scripts) can react to the
 * accessibility module without importing React: subscribe to `a11ytb:*` events.
 * The event names are part of the public API — see constants.js.
 */

export function emit(type, detail) {
  if (typeof window === 'undefined' || !type) return;
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * @param {string} type
 * @param {(detail: any, event: Event) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribe(type, handler) {
  if (typeof window === 'undefined' || !type || typeof handler !== 'function') return () => {};
  const listener = (event) => handler(event.detail, event);
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
}
