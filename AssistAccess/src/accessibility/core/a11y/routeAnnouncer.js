/**
 * Route/title change announcer.
 *
 * Single-page applications change the view without a page load. When the app does
 * not announce that itself, a screen reader user can press a link and hear nothing
 * at all. This service reports the new page title (or path) through the shared
 * announcer.
 *
 * Honesty and safety
 *  - It is a *supplement*: the app should announce its own navigation. If the user
 *    hears it twice they can switch this off, and the panel says so.
 *  - It never announces the initial page load (the screen reader already did).
 *  - Repeated URLs and titles are deduplicated, and the announcer itself drops
 *    exact repeats within 1.5 seconds.
 *  - History patching is reversible: the original methods are restored on stop, and
 *    only if nothing else replaced them in the meantime.
 */

import { formatMessage } from '../../strings.js';
import { subscribeToDomChanges } from '../dom/domRegistry.js';
import { announce } from './announcer.js';

const SETTLE_MS = 150;

function currentUrl() {
  try {
    return window.location.href;
  } catch (error) {
    return '';
  }
}

function currentPath() {
  try {
    return window.location.pathname + window.location.search;
  } catch (error) {
    return '';
  }
}

function currentTitle() {
  return (typeof document !== 'undefined' && document.title ? document.title : '').trim();
}

/**
 * @param {object} options
 * @param {() => object} options.getSettings
 * @param {() => object} [options.getStrings]
 * @param {(message: string) => void} [options.onAnnounce] for tests/logging
 */
export function createRouteAnnouncer({ getSettings, getStrings, onAnnounce } = {}) {
  let started = false;
  let unsubscribe = null;
  let timer = null;
  let lastUrl = '';
  let lastTitle = '';
  let originalPush = null;
  let originalReplace = null;
  let patchedPush = null;
  let patchedReplace = null;

  function check() {
    if (typeof window === 'undefined') return null;
    const settings = typeof getSettings === 'function' ? getSettings() : null;
    if (!settings || settings.reader.announceRouteChanges === false) return null;

    const url = currentUrl();
    const title = currentTitle();
    if (url === lastUrl && title === lastTitle) return null;
    lastUrl = url;
    lastTitle = title;

    const copy = (typeof getStrings === 'function' ? getStrings() : null) || {};
    const templates = copy.announcements || {};
    const message = formatMessage(
      title ? templates.routeChange || 'Navigated to {title}.' : templates.routeChangeUntitled || 'Navigated to {path}.',
      { title, path: currentPath() },
    );

    announce(message, { politeness: 'polite', level: 'standard', source: 'route', dedupeKey: 'route' });
    if (typeof onAnnounce === 'function') onAnnounce(message);
    return message;
  }

  function schedule() {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      check();
    }, SETTLE_MS);
  }

  function handleHistoryChange() {
    schedule();
  }

  function start() {
    if (started || typeof window === 'undefined' || !window.history) return;
    started = true;

    // Baseline: the current view has already been announced by the screen reader.
    lastUrl = currentUrl();
    lastTitle = currentTitle();

    try {
      originalPush = window.history.pushState;
      originalReplace = window.history.replaceState;
      patchedPush = function patchedPushState(...args) {
        const result = originalPush.apply(this, args);
        schedule();
        return result;
      };
      patchedReplace = function patchedReplaceState(...args) {
        const result = originalReplace.apply(this, args);
        schedule();
        return result;
      };
      window.history.pushState = patchedPush;
      window.history.replaceState = patchedReplace;
    } catch (error) {
      originalPush = null;
      originalReplace = null;
    }

    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHistoryChange);

    // Title-only changes (frameworks that set document.title themselves).
    unsubscribe = subscribeToDomChanges(() => schedule(), { debounceMs: 300 });
  }

  function stop() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (typeof window !== 'undefined' && window.history) {
      // Restore only what is still ours.
      if (patchedPush && window.history.pushState === patchedPush && originalPush) {
        window.history.pushState = originalPush;
      }
      if (patchedReplace && window.history.replaceState === patchedReplace && originalReplace) {
        window.history.replaceState = originalReplace;
      }
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener('hashchange', handleHistoryChange);
    }
    patchedPush = null;
    patchedReplace = null;
    started = false;
  }

  return {
    start,
    stop,
    /** Exposed for tests and for a manual "announce this view" action. */
    check,
    isRunning: () => started,
  };
}
