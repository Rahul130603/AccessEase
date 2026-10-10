import React from 'react';
import { createRoot } from 'react-dom/client';

import AccessibilityModule from '../src/accessibility/index.js';
import DemoPage from './DemoPage.jsx';

/**
 * Demo entry point.
 *
 * The import above is the module's public entry point — the only path an application
 * needs to know. It re-exports the widget, the settings hooks and every pattern
 * component, so integration never reaches into internal folders.
 *
 * The accessibility module wraps the demo site, which is the recommended integration
 * order: the widget's shadow host is appended to <body> as a sibling of the app root, so
 * React never renders into it and the page's CSS cannot reach it.
 *
 * `debug: true` makes the module warn in the console about unknown config keys — useful
 * while wiring, silent in production.
 */
const container = document.getElementById('root');

if (container) {
  createRoot(container).render(
    <AccessibilityModule config={{ debug: true }}>
      <DemoPage />
    </AccessibilityModule>,
  );
}
