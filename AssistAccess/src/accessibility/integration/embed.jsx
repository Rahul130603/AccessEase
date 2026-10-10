import { mountAccessibilityToolbar } from './mount.jsx';

// Standalone script-tag entry. A customer configures window.AssistAccessConfig
// before loading this file; no React import is needed on the host page.
if (typeof window !== 'undefined') {
  window.AssistAccess = window.AssistAccess || {};
  window.AssistAccess.mount = mountAccessibilityToolbar;
  if (window.AssistAccessConfig?.autoMount !== false) {
    window.AssistAccess.instance = mountAccessibilityToolbar(window.AssistAccessConfig || {});
  }
}
