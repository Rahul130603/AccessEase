/**
 * Primitives: layout, focus, launcher, switch, slider, buttons, badges.
 *
 * Scope note: every selector is rooted at `.a11ytb-*` inside the shadow root.
 * There is no element selector, no `body`/`html` rule and no `*` rule that could
 * reach the host page.
 */
const primitives = `
.a11ytb-root,
.a11ytb-root *,
.a11ytb-root *::before,
.a11ytb-root *::after {
  box-sizing: border-box;
}

/* Full-viewport, click-through layer. Absolute (not fixed) positioning keeps the
   chrome correctly placed even when the host carries the visual counter-filter,
   which makes the host a containing block for fixed descendants. */
.a11ytb-root {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: var(--a11ytb-offset-y, 16px) var(--a11ytb-offset-x, 16px);
  pointer-events: none;
  font-family: var(--a11ytb-font);
  font-size: var(--a11ytb-font-size);
  line-height: 1.45;
  color: var(--a11ytb-fg);
  text-align: start;
}

.a11ytb-root[data-corner='bottom-right'] { align-items: flex-end; justify-content: flex-end; }
.a11ytb-root[data-corner='bottom-left'] { align-items: flex-start; justify-content: flex-end; }
.a11ytb-root[data-corner='top-right'] { align-items: flex-end; justify-content: flex-start; }
.a11ytb-root[data-corner='top-left'] { align-items: flex-start; justify-content: flex-start; }

/* ── Focus ──────────────────────────────────────────────────────────────── */
.a11ytb-root :is(button, input, select, a[href], [tabindex]):focus {
  outline: 3px solid var(--a11ytb-focus);
  outline-offset: 2px;
}
/* Mouse users do not get a ring; keyboard users always do. If :focus-visible is
   unsupported the declaration above still applies. */
.a11ytb-root :is(button, input, select, a[href], [tabindex]):focus:not(:focus-visible) {
  outline: none;
}

.a11ytb-visually-hidden-inline {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ── Launcher ───────────────────────────────────────────────────────────── */
.a11ytb-launcher {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  min-block-size: 44px;
  padding: 0.55em 1em;
  font: inherit;
  font-weight: 600;
  color: var(--a11ytb-accent-fg);
  background-color: var(--a11ytb-accent);
  border: 2px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.3);
}
.a11ytb-launcher__icon { font-size: 1.15em; line-height: 1; }
.a11ytb-launcher[aria-expanded='true'] { box-shadow: 0 0 0 3px var(--a11ytb-bg), 0 2px 10px rgb(0 0 0 / 0.3); }

/* ── Buttons ────────────────────────────────────────────────────────────── */
.a11ytb-button {
  font: inherit;
  min-block-size: 32px;
  min-inline-size: var(--a11ytb-target);
  padding: 0.35em 0.8em;
  color: var(--a11ytb-fg);
  background-color: var(--a11ytb-surface);
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
  cursor: pointer;
}
.a11ytb-button:hover { border-color: var(--a11ytb-accent); }
.a11ytb-button--primary {
  color: var(--a11ytb-accent-fg);
  background-color: var(--a11ytb-accent);
  border-color: var(--a11ytb-accent);
}
.a11ytb-button--danger { color: var(--a11ytb-danger); border-color: currentColor; }
.a11ytb-button[disabled] { opacity: 0.6; cursor: not-allowed; }

.a11ytb-icon-button {
  font: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 32px;
  min-block-size: 32px;
  padding: 0.25em;
  color: inherit;
  background-color: transparent;
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
  cursor: pointer;
}

.a11ytb-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block: 0.5rem 0.25rem;
}

/* ── Switch ─────────────────────────────────────────────────────────────── */
.a11ytb-row { margin-block-end: 0.9rem; }

.a11ytb-switch {
  display: flex;
  align-items: center;
  gap: 0.6em;
  inline-size: 100%;
  min-block-size: 44px;
  padding: 0.35em 0.25em;
  font: inherit;
  color: inherit;
  text-align: start;
  background: none;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.a11ytb-switch__track {
  flex: 0 0 auto;
  inline-size: 44px;
  block-size: 24px;
  padding: 3px;
  background-color: var(--a11ytb-surface);
  border: 2px solid var(--a11ytb-border);
  border-radius: 999px;
  transition: background-color 120ms ease-out;
}
.a11ytb-switch__thumb {
  display: block;
  inline-size: 14px;
  block-size: 14px;
  background-color: var(--a11ytb-fg);
  border-radius: 50%;
  transform: translateX(0);
  transition: transform 120ms ease-out;
}
.a11ytb-switch[aria-checked='true'] .a11ytb-switch__track {
  background-color: var(--a11ytb-accent);
  border-color: var(--a11ytb-accent);
}
.a11ytb-switch[aria-checked='true'] .a11ytb-switch__thumb {
  background-color: var(--a11ytb-accent-fg);
  transform: translateX(20px);
}
.a11ytb-switch__text { display: flex; flex-direction: column; }
.a11ytb-switch__label { font-weight: 600; }
.a11ytb-switch__state { font-size: 0.85em; color: var(--a11ytb-muted); }
.a11ytb-switch[disabled] { opacity: 0.6; cursor: not-allowed; }

/* ── Slider ─────────────────────────────────────────────────────────────── */
.a11ytb-field { margin-block-end: 1rem; }
.a11ytb-field__header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
}
.a11ytb-field__label { font-weight: 600; }
.a11ytb-field__value {
  font-variant-numeric: tabular-nums;
  color: var(--a11ytb-muted);
}
.a11ytb-slider {
  inline-size: 100%;
  min-block-size: var(--a11ytb-target);
  margin-block-start: 0.35rem;
  accent-color: var(--a11ytb-accent);
}

/* ── Text helpers ───────────────────────────────────────────────────────── */
.a11ytb-hint {
  margin: 0.15rem 0 0;
  font-size: 0.9em;
  color: var(--a11ytb-muted);
}
.a11ytb-hint--small { font-size: 0.82em; }

.a11ytb-note {
  margin: 0.5rem 0 1rem;
  padding: 0.6rem 0.7rem;
  font-size: 0.9em;
  background-color: var(--a11ytb-surface);
  border-inline-start: 4px solid var(--a11ytb-accent);
  border-radius: 4px;
}
.a11ytb-note--warning { border-inline-start-color: var(--a11ytb-caution); }
.a11ytb-note__heading { margin: 0 0 0.25rem; font-size: 1em; font-weight: 700; }
.a11ytb-note ul { margin: 0.25rem 0 0; padding-inline-start: 1.15rem; }
.a11ytb-note li { margin-block-end: 0.3rem; }

.a11ytb-status {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.92em;
}

/* ── Badge / band labels (never colour-only) ────────────────────────────── */
.a11ytb-badge {
  display: inline-block;
  margin-inline-start: 0.4em;
  padding: 0.05em 0.45em;
  font-size: 0.8em;
  font-weight: 700;
  color: var(--a11ytb-accent-fg);
  background-color: var(--a11ytb-accent);
  border-radius: 999px;
}
.a11ytb-band {
  display: inline-block;
  padding: 0.05em 0.45em;
  font-size: 0.8em;
  font-weight: 700;
  border: 1px solid currentColor;
  border-radius: 4px;
}
.a11ytb-band--hazard { color: var(--a11ytb-hazard); }
.a11ytb-band--caution { color: var(--a11ytb-caution); }
.a11ytb-band--unverified { color: var(--a11ytb-muted); }
.a11ytb-band--error { color: var(--a11ytb-hazard); }
.a11ytb-band--warning { color: var(--a11ytb-caution); }
.a11ytb-band--info { color: var(--a11ytb-muted); }

/* ── Audit findings ────────────────────────────────────────────────────── */
.a11ytb-finding__message { margin: 0.2rem 0; }
.a11ytb-evidence {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88em;
  overflow-wrap: anywhere;
}

.a11ytb-details {
  margin-block-start: 0.5rem;
  padding-block-start: 0.4rem;
  border-block-start: 1px solid var(--a11ytb-border);
}
.a11ytb-details__summary {
  min-block-size: 24px;
  padding-block: 0.2rem;
  font-weight: 600;
  cursor: pointer;
}
.a11ytb-details__title { margin: 0.4rem 0 0.25rem; font-weight: 600; }

.a11ytb-code {
  margin: 0.35rem 0 0.5rem;
  padding: 0.6rem 0.7rem;
  max-inline-size: 100%;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82em;
  line-height: 1.5;
  color: var(--a11ytb-fg);
  background-color: var(--a11ytb-surface);
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
  white-space: pre;
  tab-size: 2;
}

.a11ytb-report {
  inline-size: 100%;
  margin-block-start: 0.35rem;
  padding: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82em;
  color: var(--a11ytb-fg);
  background-color: var(--a11ytb-bg);
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
}

/* ── Heading outline (real nested lists) ───────────────────────────────── */
.a11ytb-outline {
  margin: 0.35rem 0 0.75rem;
  padding-inline-start: 1.1rem;
}
.a11ytb-outline__item { margin-block: 0.15rem; }
.a11ytb-outline__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
}
.a11ytb-outline__button {
  font: inherit;
  min-block-size: 24px;
  padding: 0.1rem 0.35rem;
  color: inherit;
  text-align: start;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.a11ytb-outline__button:hover { border-color: var(--a11ytb-accent); }

/* ── Announcement log ──────────────────────────────────────────────────── */
.a11ytb-log { list-style: none; margin: 0.35rem 0 0.75rem; padding: 0; }
.a11ytb-log__item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
  padding-block: 0.25rem;
  border-block-end: 1px solid var(--a11ytb-border);
}
.a11ytb-log__text { flex: 1 1 12rem; overflow-wrap: anywhere; }

/* ── Rendered alt-text examples ────────────────────────────────────────── */
.a11ytb-example-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-block: 0.5rem 0.75rem;
}
.a11ytb-example {
  flex: 1 1 12rem;
  margin: 0;
  padding: 0.5rem;
  background-color: var(--a11ytb-surface);
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
}
.a11ytb-example img { display: block; max-inline-size: 100%; block-size: auto; }
.a11ytb-example figcaption { display: flex; flex-direction: column; gap: 0.15rem; margin-block-start: 0.4rem; }

.a11ytb-audit-group + .a11ytb-audit-group { margin-block-start: 0.75rem; }

/* ── Findings list ─────────────────────────────────────────────────────── */
.a11ytb-findings { list-style: none; margin: 0.5rem 0 0; padding: 0; }
.a11ytb-finding {
  margin-block-end: 0.6rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--a11ytb-border);
  /* Shared card radius (accessibility.css defines the token for the widget). The inner
     padding stays: a bordered card is a bounded object, unlike the full-bleed blocks
     whose text shares the panel's single inset. */
  border-radius: var(--a11ytb-card-radius, 12px);
}
.a11ytb-finding__head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
  margin-block-end: 0.3rem;
}
.a11ytb-finding__label { font-weight: 600; overflow-wrap: anywhere; }
.a11ytb-finding__meta { margin: 0.15rem 0; font-size: 0.88em; color: var(--a11ytb-muted); }
.a11ytb-finding__actions { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-block-start: 0.4rem; }

.a11ytb-uninspectable { list-style: disc; margin: 0.35rem 0 0; padding-inline-start: 1.15rem; font-size: 0.9em; }
.a11ytb-uninspectable li { margin-block-end: 0.25rem; }

/* ── Fieldsets and radio choices ───────────────────────────────────────── */
.a11ytb-feature { display: block; }

.a11ytb-fieldset {
  margin: 0 0 1rem;
  padding: 0.6rem 0.75rem 0.4rem;
  border: 1px solid var(--a11ytb-border);
  border-radius: 8px;
}

.a11ytb-legend {
  padding-inline: 0.35rem;
  font-weight: 700;
}

.a11ytb-choice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-block-size: var(--a11ytb-target);
  padding: 0.3rem 0.15rem;
  cursor: pointer;
}
.a11ytb-choice input[type='radio'] {
  inline-size: 18px;
  block-size: 18px;
  margin-block-start: 0.15rem;
  accent-color: var(--a11ytb-accent);
}
.a11ytb-choice__text { display: flex; flex-direction: column; }
.a11ytb-choice__label { font-weight: 600; }

/* A radio choice with a secondary action (delete a saved profile) on the same row. */
.a11ytb-choice-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.a11ytb-choice-row .a11ytb-choice { flex: 1 1 auto; }
.a11ytb-choice-row .a11ytb-button { flex: 0 0 auto; margin-block-start: 0.3rem; }

.a11ytb-select {
  inline-size: 100%;
  min-block-size: 32px;
  margin-block-start: 0.35rem;
  padding: 0.25rem 0.4rem;
  font: inherit;
  color: var(--a11ytb-fg);
  background-color: var(--a11ytb-bg);
  border: 1px solid var(--a11ytb-border);
  border-radius: 6px;
}
.a11ytb-select[disabled] { opacity: 0.7; }
`;

export default primitives;
