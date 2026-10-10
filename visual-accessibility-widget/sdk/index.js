import { createWidget } from './widget.js';

let instance;
export const AccessibilityWidget = {
  init(options = {}) {
    if (instance && !instance.destroyed) return instance;
    instance = createWidget(options);
    return instance;
  },
  destroy() { instance?.destroy(); instance = undefined; },
  getInstance() { return instance && !instance.destroyed ? instance : null; },
};
