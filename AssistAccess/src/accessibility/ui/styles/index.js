/**
 * Style bundle for the shadow root.
 *
 * The parts are plain CSS strings rather than `.css` imports on purpose: a plain
 * `import './panel.css'` injects into the *document*, which would leak into the
 * host application and break the isolation contract. Strings let the same CSS be
 * adopted inside the shadow root regardless of the bundler (Vite, webpack, CRA,
 * or no bundler at all).
 *
 * If your bundler supports `?inline`, you may move each part into a `.css` file
 * and import it here — the rest of the module does not care.
 */

import tokens from './tokens.js';
import primitives from './primitives.js';
import panel from './panel.js';
import highContrast from './highContrast.js';
import reducedMotion from './reducedMotion.js';
import WIDGET_STYLES from './widget.js';

export const STYLE_PARTS = Object.freeze({
  tokens,
  primitives,
  panel,
  highContrast,
  reducedMotion,
  widget: WIDGET_STYLES,
});

let cached = null;

/** Full stylesheet text for the toolbar's shadow root. */
export function getStylesText() {
  if (cached === null) {
    cached = [
      '/* AssistAccess accessibility toolbar — shadow-scoped styles */',
      tokens,
      primitives,
      panel,
      highContrast,
      reducedMotion,
      /* The widget chrome comes last so its layout rules win where they overlap. */
      WIDGET_STYLES,
    ].join('\n');
  }
  return cached;
}

export { WIDGET_STYLES };

export default getStylesText;
