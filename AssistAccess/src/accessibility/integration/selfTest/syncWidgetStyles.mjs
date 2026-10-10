/**
 * Regenerates `ui/styles/widget.js` from `accessibility.css`.
 *
 *     node src/accessibility/integration/selfTest/syncWidgetStyles.mjs
 *
 * The widget stylesheet is written once, in plain CSS, and then mirrored as a string
 * so it can be adopted inside the toolbar's shadow root without a bundler-specific
 * import. This script is what keeps the mirror honest: it is generated, never typed.
 * The self-test compares the two byte for byte, so a stylesheet edit that is not
 * followed by this command fails the suite.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../../accessibility.css', import.meta.url);
const target = new URL('../../ui/styles/widget.js', import.meta.url);

const css = readFileSync(source, 'utf8').replace(/\r\n/g, '\n').trimEnd();
const escaped = css
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const banner = `/**
 * The widget stylesheet, as a string, for adoption inside the shadow root.
 *
 * GENERATED FILE — edit accessibility.css and re-run
 *     node src/accessibility/integration/selfTest/syncWidgetStyles.mjs
 * The self-test compares this string with the stylesheet byte for byte, so an edit
 * made in only one of the two files fails the suite.
 *
 * Why a mirror instead of a plain CSS import
 * -----------------------------------------
 * \`import './accessibility.css'\` injects into the *document*, which would leak the
 * widget's styles into the host application. A shadow root can only be styled by CSS
 * text it owns (\`<style>\`, \`adoptedStyleSheets\`) or by a \`<link>\`, and the emitted
 * URL of a \`<link>\` differs between development and production builds, so it cannot
 * be produced in a bundler-agnostic way.
 *
 * If your bundler supports inline CSS imports you may delete this file and use the
 * stylesheet directly:
 *
 *     import WIDGET_STYLES from './accessibility.css?inline';   // Vite
 *     import WIDGET_STYLES from './accessibility.css';          // webpack 5, asset/source
 */

`;

writeFileSync(
  target,
  `${banner}const WIDGET_STYLES = \`${escaped}\`;\n\nexport { WIDGET_STYLES };\nexport default WIDGET_STYLES;\n`,
  'utf8',
);

console.log(`widget.js regenerated from accessibility.css (${css.length} characters)`);
