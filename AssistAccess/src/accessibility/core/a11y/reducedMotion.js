/**
 * `prefers-reduced-motion` helpers.
 *
 * The operating system setting is the default source of truth; the toolbar's own
 * toggle only overrides it when the user explicitly changes it (see
 * `resolveReducedMotion` in settingsSchema.js).
 */

import { useEffect, useState } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getMatchMedia() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/** Current OS preference. Returns false when the API is unavailable. */
export function prefersReducedMotion() {
  const query = getMatchMedia();
  return query ? query.matches === true : false;
}

/**
 * Subscribe to OS preference changes.
 * @param {(matches: boolean) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeReducedMotion(callback) {
  const query = getMatchMedia();
  if (!query || typeof callback !== 'function') return () => {};
  const handler = (event) => callback(event.matches === true);
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }
  // Safari < 14
  if (typeof query.addListener === 'function') {
    query.addListener(handler);
    return () => query.removeListener(handler);
  }
  return () => {};
}

/** React hook for the OS preference. */
export function useReducedMotion() {
  const [matches, setMatches] = useState(() => prefersReducedMotion());
  useEffect(() => subscribeReducedMotion(setMatches), []);
  return matches;
}
