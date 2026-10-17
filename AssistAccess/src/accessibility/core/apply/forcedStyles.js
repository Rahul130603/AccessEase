/**
 * The module's `!important` allowlist.
 *
 * Every rule below is (a) user-initiated, (b) scoped to a namespaced data
 * attribute, (c) removed the moment the corresponding setting is switched off.
 * Nothing here targets a class, id or element from the host application, so it
 * cannot overwrite another developer's declarations — it only wins the cascade
 * for the specific elements the user asked the toolbar to change.
 */

import { STYLE_IDS } from '../../constants.js';

/** id → why this stylesheet is allowed to use !important. */
export const FORCED_STYLE_NOTES = Object.freeze({
  [STYLE_IDS.MOTION]:
    'User-requested motion override, scoped to the element carrying data-a11ytb-motion-scope. !important is required so a user preference beats component-level animation declarations; the stylesheet is deleted as soon as motion reduction is switched off.',
  [STYLE_IDS.FLASH_GUARD]:
    'Marks elements the flash guard paused or hid, scoped to data-a11ytb-flash-* attributes set by the guard itself. Reversible per element from the panel.',
  [STYLE_IDS.SAFE_PATTERN]:
    'Layout and focus styles for the app-owned SafeAnimatedContent pattern. Namespaced .a11ytb-safe-motion classes only; injected once and released when the last instance unmounts.',
  [STYLE_IDS.AUDIT_HIGHLIGHT]:
    'Temporary outline for the element an audit finding points at. Added only when the user asks to be shown the element, removed after a few seconds or on close, and it uses outline (no layout change) so the page cannot shift while the user is reading it.',
});

/**
 * Motion override stylesheet.
 * @param {{strategy: 'instant'|'pause', pauseAll: boolean}} options
 */
export function buildMotionOverrideCss({ strategy = 'instant', pauseAll = false } = {}) {
  const scope = '[data-a11ytb-motion-scope]';
  const targets = `${scope} *,\n${scope} *::before,\n${scope} *::after`;

  if (pauseAll) {
    return `/* accessibility toolbar: user requested pausing (data-a11ytb-motion-scope) */
${targets} {
  animation-play-state: paused !important;
  scroll-behavior: auto !important;
}
${scope} * {
  transition-property: none !important;
}
${scope} {
  scroll-behavior: auto !important;
}`;
  }

  return `/* accessibility toolbar: user requested reduced motion (data-a11ytb-motion-scope) */
${targets} {
  scroll-behavior: auto !important;
}
${scope} {
  scroll-behavior: auto !important;
}`;
}

/** Stylesheet for the flash guard's element markers. */
export function buildFlashGuardCss() {
  return `/* accessibility toolbar: elements changed by flashing protection */
[data-a11ytb-flash-hidden] {
  visibility: hidden !important;
}
[data-a11ytb-flash-paused] {
  animation-play-state: paused !important;
}`;
}

/** Stylesheet for the audit's temporary "show me where" highlight. */
export function buildAuditHighlightCss() {
  return `/* accessibility toolbar: temporary highlight for an audit finding.
   outline is used instead of a border so nothing on the page moves. */
[data-a11ytb-audit-highlight] {
  outline: 3px solid #b5179e !important;
  outline-offset: 2px !important;
  scroll-margin-block: 25vh;
}
@media (forced-colors: active) {
  [data-a11ytb-audit-highlight] {
    outline: 3px solid Highlight !important;
  }
}`;
}

/** Stylesheet for app-owned SafeAnimatedContent instances (light DOM). */export function buildSafeMotionPatternCss() {
  return `/* accessibility toolbar: safe motion pattern (app-owned markup) */
.a11ytb-safe-motion {
  margin: 0;
}
.a11ytb-safe-motion__frame {
  position: relative;
}
/* The harness/app may set a rule that turns the "hidden" attribute back into a
   visible box; make hiding authoritative for the pattern's own frame so the hide
   control always works. */
.a11ytb-safe-motion__frame[hidden] {
  display: none !important;
}
.a11ytb-safe-motion[data-a11ytb-safe-motion="paused"] .a11ytb-safe-motion__frame *,
.a11ytb-safe-motion[data-a11ytb-safe-motion="paused"] .a11ytb-safe-motion__frame *::before,
.a11ytb-safe-motion[data-a11ytb-safe-motion="paused"] .a11ytb-safe-motion__frame *::after {
  animation-play-state: paused !important;
  transition-property: none !important;
}
.a11ytb-safe-motion__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-block-start: 0.5rem;
}
.a11ytb-safe-motion__button {
  font: inherit;
  min-block-size: 24px;
  min-inline-size: 24px;
  padding: 0.35em 0.75em;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.a11ytb-safe-motion__button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}
.a11ytb-safe-motion__notice {
  margin: 0.25rem 0 0;
  font-size: 0.875em;
}
.a11ytb-safe-motion__caption {
  margin: 0 0 0.25rem;
  font-size: 0.875em;
}`;
}
