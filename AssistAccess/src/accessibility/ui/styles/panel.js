/**
 * Panel layout: non-modal dialog shell, scrolling body, reflow behaviour.
 *
 * Reflow (WCAG 1.4.10): the panel is capped to the space between the configured
 * offsets, scrolls vertically and never forces horizontal scrolling, including at
 * a 320px-wide viewport (equivalent to 400% zoom on a 1280px display).
 */
const panel = `
.a11ytb-panel {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  inline-size: 24rem;
  max-inline-size: 100%;
  max-block-size: calc(100vh - 2 * var(--a11ytb-offset-y, 16px));
  max-block-size: calc(100dvh - 2 * var(--a11ytb-offset-y, 16px));
  color: var(--a11ytb-fg);
  background-color: var(--a11ytb-bg);
  border: 1px solid var(--a11ytb-border);
  border-radius: var(--a11ytb-radius);
  box-shadow: 0 10px 34px rgb(0 0 0 / 0.35);
}

.a11ytb-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.6rem;
  border-block-end: 1px solid var(--a11ytb-border);
}

.a11ytb-panel__title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.3;
}

.a11ytb-panel__body {
  padding: 0.85rem 1rem 1.1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  overflow-wrap: break-word;
}

.a11ytb-panel__footer {
  padding: 0.6rem 1rem;
  border-block-start: 1px solid var(--a11ytb-border);
}

/* ── Disclosure sections ───────────────────────────────────────────────── */
.a11ytb-disclosure { margin-block-end: 0.5rem; }
.a11ytb-disclosure__heading { margin: 0; font-size: 1rem; }

.a11ytb-disclosure__button {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  inline-size: 100%;
  min-block-size: 44px;
  padding: 0.5rem 0.35rem;
  font: inherit;
  font-weight: 700;
  color: inherit;
  text-align: start;
  background: none;
  border: 0;
  border-block-end: 1px solid var(--a11ytb-border);
  border-radius: 6px;
  cursor: pointer;
}

.a11ytb-disclosure__chevron { inline-size: 1em; }
.a11ytb-disclosure__title { flex: 1 1 auto; }
.a11ytb-disclosure__region { padding: 0.75rem 0.35rem 0.25rem; }

/* Small screens / high zoom: the panel uses the full available width. */
@media (max-width: 30rem) {
  .a11ytb-panel { inline-size: 100%; }
  .a11ytb-panel__body { padding-inline: 0.75rem; }
}

/* Text-spacing overrides (WCAG 1.4.12) must not clip panel content. */
.a11ytb-panel,
.a11ytb-panel * {
  line-height: 1.45;
}
`;

export default panel;
