import React from 'react';

import { AccessibilityGlyph } from './ui/icons.jsx';

/**
 * The floating accessibility button.
 *
 * Behaviour
 * ---------
 *  - A real `<button>`, so mouse, touch, Enter and Space all work, and screen readers
 *    announce it as a button with a name.
 *  - The accessible name is the stable "Open accessibility settings" (from
 *    `strings.widget.launcher`). Its state is exposed with `aria-expanded`, which is
 *    the APG pattern for a control that shows and hides a panel: a name that changes
 *    between "Open…" and "Close…" makes the button harder to find again by voice or
 *    by name navigation.
 *  - `aria-controls` is only set while the panel exists, so the reference is never
 *    dangling.
 *  - Both mouse and keyboard activation run the same `onToggle`, so opening and
 *    closing are one code path (React state, owned by the module chrome).
 *
 * Presentation lives in accessibility.css (`.a11ytb-launcher--circle`): a 56px blue
 * circle pinned to the right edge, white glyph, subtle shadow, white focus ring plus
 * a blue halo so the indicator stays visible on any page background.
 */
export default function AccessibilityLauncher({ open, onToggle, controlsId, label, launcherRef }) {
  return (
    <button
      type="button"
      className="a11ytb-launcher a11ytb-launcher--circle"
      aria-expanded={open}
      aria-controls={open ? controlsId : undefined}
      aria-label={label}
      data-open={open ? 'true' : 'false'}
      onClick={onToggle}
      ref={launcherRef}
    >
      <AccessibilityGlyph />
      <span className="a11ytb-launcher__dot" aria-hidden="true" hidden={!open} />
    </button>
  );
}
