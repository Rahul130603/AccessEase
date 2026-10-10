/**
 * Forced-colors and high-contrast support for the toolbar's own UI.
 *
 * Windows High Contrast Mode replaces author colours. Our visual filters fight
 * that mode, so the panel tells the user when forced colors are active (see
 * VisualsPanel) and the chrome here switches to system colour keywords so states
 * remain distinguishable without relying on our palette.
 */
const highContrast = `
@media (forced-colors: active) {
  :host {
    --a11ytb-bg: Canvas;
    --a11ytb-fg: CanvasText;
    --a11ytb-muted: CanvasText;
    --a11ytb-surface: Canvas;
    --a11ytb-border: ButtonText;
    --a11ytb-accent: Highlight;
    --a11ytb-accent-fg: HighlightText;
    --a11ytb-focus: Highlight;
    --a11ytb-hazard: CanvasText;
    --a11ytb-caution: CanvasText;
  }

  .a11ytb-launcher,
  .a11ytb-panel,
  .a11ytb-button,
  .a11ytb-icon-button,
  .a11ytb-finding,
  .a11ytb-switch__track,
  .a11ytb-badge,
  .a11ytb-band {
    border: 1px solid CanvasText;
    forced-color-adjust: auto;
  }

  .a11ytb-launcher {
    background-color: ButtonFace;
    color: ButtonText;
  }

  .a11ytb-switch[aria-checked='true'] .a11ytb-switch__track {
    background-color: Highlight;
    border-color: Highlight;
  }
  .a11ytb-switch[aria-checked='true'] .a11ytb-switch__thumb {
    background-color: HighlightText;
  }

  .a11ytb-badge {
    background-color: Highlight;
    color: HighlightText;
  }
}

@media (prefers-contrast: more) {
  :host {
    --a11ytb-border: currentColor;
  }
  .a11ytb-panel,
  .a11ytb-finding,
  .a11ytb-button {
    border-width: 2px;
  }
}
`;

export default highContrast;
