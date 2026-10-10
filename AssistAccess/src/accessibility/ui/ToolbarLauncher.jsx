import React from 'react';

/**
 * The toolbar launcher button.
 *
 * `aria-expanded` + `aria-controls` describe the relationship with the panel. The
 * launcher and the panel live in the same shadow root, so the IDREF resolves —
 * this is why the toolbar's own chrome is shadow-scoped but page-facing ARIA
 * references never are.
 */
export default function ToolbarLauncher({ open, onToggle, controlsId, label, buttonRef }) {
  return (
    <button
      type="button"
      className="a11ytb-launcher"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
      ref={buttonRef}
    >
      <span className="a11ytb-launcher__icon" aria-hidden="true">
        ◍
      </span>
      <span className="a11ytb-launcher__label">{label}</span>
    </button>
  );
}
