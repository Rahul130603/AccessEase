/**
 * Small media-query hooks used by the feature panels.
 *
 * `prefers-reduced-motion` has its own module (core/a11y/reducedMotion.js) because
 * it also drives the motion applier; these are the panel-only queries.
 */

import { useEffect, useState } from 'react';

function matches(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches === true;
}

/**
 * @param {string} query a media query string
 * @returns {boolean} current match state (re-renders on change)
 */
export function useMediaQuery(query) {
  const [value, setValue] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(query);
    const handler = (event) => setValue(event.matches === true);
    setValue(list.matches === true);
    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', handler);
      return () => list.removeEventListener('change', handler);
    }
    if (typeof list.addListener === 'function') {
      list.addListener(handler);
      return () => list.removeListener(handler);
    }
    return undefined;
  }, [query]);

  return value;
}

/** True when Windows High Contrast / forced-colors mode is active. */
export function useForcedColors() {
  return useMediaQuery('(forced-colors: active)');
}

/** True when the user asked for more contrast. */
export function usePrefersContrast() {
  return useMediaQuery('(prefers-contrast: more)');
}
