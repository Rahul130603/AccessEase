import React from 'react';
import { createRoot } from 'react-dom/client';

import AccessibilityModule from '../../AccessibilityModule.jsx';
import HostApp from './HostApp.jsx';
import './hostStyles.css';

/**
 * Dev harness entry point.
 *
 * The accessibility module wraps the host application, which is the recommended
 * integration order: the module's shadow host is appended to <body> as a sibling of
 * the app root, and the settings provider sits above the app so teammates can use
 * the hooks.
 */
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <AccessibilityModule config={{ debug: true }}>
      <HostApp />
    </AccessibilityModule>,
  );
}
