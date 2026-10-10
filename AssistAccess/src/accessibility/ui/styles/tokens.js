/**
 * Design tokens for the toolbar's own UI.
 *
 * Plain CSS, exported as a string so the whole stylesheet can be adopted inside
 * the shadow root. Nothing here is injected into the page, so none of it can
 * affect the host application's styles.
 *
 * Teammates can restyle the toolbar without touching this file by passing
 * `config.theme = { '--a11ytb-accent': '#005ea8', ... }` — the tokens are set on
 * the shadow host and inherited by everything inside it.
 */
const tokens = `
:host {
  --a11ytb-z-toolbar: 2147483000;

  --a11ytb-font: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --a11ytb-font-size: 15px;
  --a11ytb-radius: 10px;

  --a11ytb-bg: #ffffff;
  --a11ytb-fg: #14161c;
  --a11ytb-muted: #545a6b;
  --a11ytb-surface: #f1f2f6;
  --a11ytb-border: #b4b9c6;
  --a11ytb-accent: #0b4fd8;
  --a11ytb-accent-fg: #ffffff;
  --a11ytb-danger: #9d1c24;
  --a11ytb-focus: #0b4fd8;
  --a11ytb-hazard: #9d1c24;
  --a11ytb-caution: #7a4b00;

  /* Minimum hit area. 24px is the WCAG 2.5.8 floor; controls are larger. */
  --a11ytb-target: 24px;

  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :host {
    --a11ytb-bg: #171a21;
    --a11ytb-fg: #f2f4f8;
    --a11ytb-muted: #b7bdcc;
    --a11ytb-surface: #232733;
    --a11ytb-border: #4d5468;
    --a11ytb-accent: #93b8ff;
    --a11ytb-accent-fg: #0b1220;
    --a11ytb-danger: #ff9aa4;
    --a11ytb-focus: #ffd166;
    --a11ytb-hazard: #ff9aa4;
    --a11ytb-caution: #ffd166;
  }
}
`;

export default tokens;
