import { AccessibilityWidget } from './index.js';

window.AccessibilityWidget = AccessibilityWidget;
const script = document.currentScript;
const options = {
  siteKey: script?.dataset.siteKey,
  primaryColor: script?.dataset.primaryColor,
  root: script?.dataset.contentRoot,
  nonce: script?.nonce,
};
if (script?.dataset.autoInit !== 'false') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => AccessibilityWidget.init(options), { once: true });
  else AccessibilityWidget.init(options);
}
