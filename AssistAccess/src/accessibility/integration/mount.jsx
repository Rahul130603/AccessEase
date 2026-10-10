import React from 'react';
import { createRoot } from 'react-dom/client';

import AccessibilityModule from '../AccessibilityModule.jsx';
import { EVENTS } from '../constants.js';
import { emit } from './events.js';

/**
 * Imperative mount for pages that are not React applications (or for a teammate
 * who wants to add the toolbar from a plain script).
 *
 * This file is `.jsx` (not `.js`) on purpose: it contains JSX, and Vite/esbuild do
 * not apply the JSX transform to `.js` files by default.
 *
 * @param {object} [config] same config object as <AccessibilityModule config>
 * @returns {{ unmount: () => void, open: () => void, close: () => void, container: HTMLElement }}
 */
export function mountAccessibilityToolbar(config = {}) {
  if (typeof document === 'undefined') {
    throw new Error('mountAccessibilityToolbar() can only run in a browser.');
  }

  const container = document.createElement('div');
  container.setAttribute('data-a11ytb-mount', '');
  container.setAttribute('data-a11ytb-injected', '');
  (document.body || document.documentElement).appendChild(container);

  const root = createRoot(container);
  root.render(<AccessibilityModule config={config} />);

  return {
    container,
    open() {
      emit(EVENTS.PANEL_OPEN_REQUEST, {});
    },
    close() {
      emit(EVENTS.PANEL_CLOSE_REQUEST, {});
    },
    unmount() {
      root.unmount();
      if (container.parentNode) container.parentNode.removeChild(container);
    },
  };
}

export default mountAccessibilityToolbar;
