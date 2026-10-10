/**
 * The widget stylesheet, as a string, for adoption inside the shadow root.
 *
 * GENERATED FILE — edit accessibility.css and re-run
 *     node src/accessibility/integration/selfTest/syncWidgetStyles.mjs
 * The self-test compares this string with the stylesheet byte for byte, so an edit
 * made in only one of the two files fails the suite.
 *
 * Why a mirror instead of a plain CSS import
 * -----------------------------------------
 * `import './accessibility.css'` injects into the *document*, which would leak the
 * widget's styles into the host application. A shadow root can only be styled by CSS
 * text it owns (`<style>`, `adoptedStyleSheets`) or by a `<link>`, and the emitted
 * URL of a `<link>` differs between development and production builds, so it cannot
 * be produced in a bundler-agnostic way.
 *
 * If your bundler supports inline CSS imports you may delete this file and use the
 * stylesheet directly:
 *
 *     import WIDGET_STYLES from './accessibility.css?inline';   // Vite
 *     import WIDGET_STYLES from './accessibility.css';          // webpack 5, asset/source
 */

const WIDGET_STYLES = `/*
 * AssistAccess accessibility widget — widget chrome stylesheet.
 *
 * Scope
 * -----
 * Every rule is namespaced with \`a11ytb-\` and every selector is rooted at the
 * widget's own classes, so this file can be:
 *   - adopted inside the toolbar's shadow root (the default: no leakage in either
 *     direction), or
 *   - linked by an application that renders the widget in the light DOM.
 *
 * Widget-specific custom properties carry fallbacks, so the stylesheet is
 * self-contained when the module's design tokens are not present. Colour values come
 * from the existing tokens with a blue fallback: change \`--a11ytb-accent\` to match a
 * brand without touching these rules.
 *
 * NOTE FOR MAINTAINERS
 * --------------------
 * This file is the authored source of truth. It is mirrored as a string in
 * \`ui/styles/widget.js\`, because a shadow root cannot load a linked stylesheet in a
 * bundler-agnostic way. The self-test compares the two byte for byte
 * (\`widgetStyles match accessibility.css\`), so they cannot drift apart.
 */

.a11ytb-root {
  --a11ytb-widget-width: 22rem;
  --a11ytb-widget-radius: 16px;
  --a11ytb-widget-shadow: 0 12px 40px rgb(15 23 42 / 0.22), 0 2px 8px rgb(15 23 42 / 0.12);
  --a11ytb-widget-gap: 0.75rem;
  --a11ytb-launcher-size: 56px;

  /* One inset grid for everything inside the panel. Blocks that draw a background
     (quick settings, page check, alt-text cards, finding cards) use the same inline
     padding as the panel body, so their text shares the body's text edge; the
     disclosure row is the only indent, and its description is indented by the same
     amount so title and description line up. */
  --a11ytb-widget-pad: 1rem;
  --a11ytb-block-gap: 1rem;
  --a11ytb-card-radius: 12px;
  /* Leading slot of a feature row: chevron (1em) + gap + icon (22px) + gap. */
  --a11ytb-disclosure-lead: 3.375rem;
}

/* Alt-text review cards stay inside the widget's shadow stylesheet. */
.a11ytb-alt-card {
  margin-block: var(--a11ytb-block-gap);
  padding: 0.75rem;
  /* Theme-aware surface: the card inherits the surrounding text colour, so a fixed
     near-white background made its text unreadable in dark mode. */
  border: 1px solid var(--a11ytb-border, #cbd9f0);
  border-radius: var(--a11ytb-card-radius);
  background: var(--a11ytb-surface, #f8fbff);
}
.a11ytb-alt-card__top { display: flex; align-items: flex-start; gap: .65rem; min-width: 0; }
.a11ytb-alt-card__top > div { min-width: 0; overflow-wrap: anywhere; }
.a11ytb-alt-card__top p { margin-block: .25rem; }
.a11ytb-alt-card__preview { width: 68px; height: 55px; object-fit: contain; flex: none; border: 1px solid var(--a11ytb-border, #d6e2f4); border-radius: 6px; background: var(--a11ytb-bg, #ffffff); }
.a11ytb-alt-card__input { display: block; box-sizing: border-box; width: 100%; min-height: 4.5rem; margin-block: .35rem .6rem; padding: .5rem; border: 1px solid var(--a11ytb-border, #8aa9d7); border-radius: 8px; color: var(--a11ytb-fg, #14213d); background: var(--a11ytb-bg, #ffffff); font: inherit; resize: vertical; }
.a11ytb-alt-card__consent { display: flex; align-items: flex-start; gap: .5rem; margin-block: .5rem; cursor: pointer; }
.a11ytb-alt-card__consent input { margin-block-start: .25rem; flex: none; }
.a11ytb-alt-card :is(button, input, textarea):focus-visible { outline: 3px solid #0b4fd8; outline-offset: 2px; }

/* ── Layout anchors ─────────────────────────────────────────────────────────
   The launcher and the panel are siblings inside the toolbar's click-through
   layer. \`right-middle\` keeps both vertically centred against the right edge, with
   the panel opening to the left of the button.

   The order is set here rather than relying on DOM order or on \`row-reverse\`
   (where \`flex-start\`/\`flex-end\` swap meaning): the panel is placed first and the
   launcher last, so the launcher always ends up hard against the edge. */
.a11ytb-root[data-corner='right-middle'] {
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: var(--a11ytb-widget-gap);
}

.a11ytb-root[data-corner='right-middle'] .a11ytb-widget {
  order: 1;
}

.a11ytb-root[data-corner='right-middle'] .a11ytb-launcher {
  order: 2;
}

/* ── Floating launcher ──────────────────────────────────────────────────── */
.a11ytb-launcher--circle {
  pointer-events: auto;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--a11ytb-launcher-size);
  block-size: var(--a11ytb-launcher-size);
  min-inline-size: 44px;
  min-block-size: 44px;
  padding: 0;
  color: #ffffff;
  background-color: var(--a11ytb-accent, #0b4fd8);
  background-image: linear-gradient(145deg, rgb(255 255 255 / 0.18), rgb(0 0 0 / 0.12));
  border: 0;
  border-radius: 50%;
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.28), 0 1px 3px rgb(15 23 42 / 0.2);
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}

.a11ytb-launcher--circle:hover {
  transform: scale(1.04);
  box-shadow: 0 10px 26px rgb(15 23 42 / 0.32), 0 1px 3px rgb(15 23 42 / 0.24);
}

.a11ytb-launcher--circle:active {
  transform: scale(0.98);
}

.a11ytb-launcher--circle:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px var(--a11ytb-accent, #0b4fd8), 0 6px 18px rgb(15 23 42 / 0.28);
}

.a11ytb-launcher--circle svg {
  inline-size: 60%;
  block-size: 60%;
}

/* A small dot that marks the open state without changing the accessible name. */
.a11ytb-launcher__dot {
  position: absolute;
  inset-block-start: 6px;
  inset-inline-end: 6px;
  inline-size: 8px;
  block-size: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--a11ytb-accent, #0b4fd8);
}

/* ── Panel shell ────────────────────────────────────────────────────────── */
.a11ytb-widget {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  inline-size: var(--a11ytb-widget-width);
  max-inline-size: 100%;
  max-block-size: calc(100vh - 2rem);
  max-block-size: calc(100dvh - 2rem);
  color: var(--a11ytb-fg, #14161c);
  background-color: #ffffff;
  background-color: var(--a11ytb-bg, #ffffff);
  border: 1px solid var(--a11ytb-border, #dfe3ec);
  border-radius: var(--a11ytb-widget-radius);
  box-shadow: var(--a11ytb-widget-shadow);
  overflow: hidden;
}

.a11ytb-widget__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 0.75rem 0.85rem 1rem;
  background-image: linear-gradient(180deg, rgb(11 79 216 / 0.06), rgb(11 79 216 / 0));
  border-block-end: 1px solid var(--a11ytb-border, #dfe3ec);
}

.a11ytb-widget__heading {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.a11ytb-widget__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
}

.a11ytb-widget__subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.8em;
  color: var(--a11ytb-muted, #545a6b);
}

.a11ytb-widget__close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 36px;
  block-size: 36px;
  padding: 0;
  color: inherit;
  background-color: transparent;
  border: 1px solid var(--a11ytb-border, #dfe3ec);
  border-radius: 50%;
  cursor: pointer;
}

.a11ytb-widget__close:hover {
  border-color: var(--a11ytb-accent, #0b4fd8);
}

.a11ytb-widget__body {
  padding: 0.85rem var(--a11ytb-widget-pad) 1.1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  overflow-wrap: break-word;
}

/* ── Panel controls ───────────────────────────────────────────────────────
   Inputs that the panels render are inside the shadow root, where the module's
   light-DOM stylesheet (patterns/appStyles.js) cannot reach them. Without these
   rules the profile-name field and the import file input fall back to browser
   defaults — 21px tall, no border, a different font — next to 32px controls. */
.a11ytb-widget :is(input.a11ytb-form__control, textarea.a11ytb-report) {
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: 32px;
  padding: 0.4rem 0.5rem;
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--a11ytb-fg, #14161c);
  background-color: #ffffff;
  background-color: var(--a11ytb-bg, #ffffff);
  border: 1px solid var(--a11ytb-border, #dfe3ec);
  border-radius: 6px;
}

.a11ytb-widget textarea.a11ytb-report {
  min-block-size: 8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82rem;
}

.a11ytb-widget input[type='file'].a11ytb-form__control {
  padding: 0.35rem;
  font-size: 0.85rem;
}

.a11ytb-widget :is(input.a11ytb-form__control, textarea.a11ytb-report):focus-visible {
  outline: 3px solid var(--a11ytb-focus, #0b4fd8);
  outline-offset: 2px;
}

.a11ytb-widget__footer {
  padding: 0.65rem 1rem;
  font-size: 0.85em;
  color: var(--a11ytb-muted, #545a6b);
  background-color: var(--a11ytb-surface, #f1f2f6);
  border-block-start: 1px solid var(--a11ytb-border, #dfe3ec);
}

.a11ytb-widget__footer p {
  margin: 0;
}

/* ── Quick settings ─────────────────────────────────────────────────────── */
/* Full-bleed block: its background spans the panel's content width and its text sits
   on the same inset as every other text block. Bounded objects (finding cards,
   alt-text cards, buttons, chips) keep their own internal padding. */
.a11ytb-quick {
  margin-block-end: var(--a11ytb-block-gap);
  padding: 0.85rem 0 0.9rem;
  background-color: var(--a11ytb-surface, #f1f2f6);
  border-radius: var(--a11ytb-card-radius);
}

.a11ytb-quick__heading {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--a11ytb-muted, #545a6b);
}

.a11ytb-quick__profiles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 0.6rem;
  padding: 0;
  border: 0;
}

.a11ytb-quick__profile {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-block-size: 32px;
  padding: 0.3rem 0.65rem;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--a11ytb-fg, #14161c);
  /* Token background, not white: the text colour follows the theme, so a hard-coded
     white chip became white-on-white in dark mode. */
  background-color: var(--a11ytb-bg, #ffffff);
  border: 1px solid var(--a11ytb-border, #dfe3ec);
  border-radius: 999px;
  cursor: pointer;
}

.a11ytb-quick__profile:hover {
  border-color: var(--a11ytb-accent, #0b4fd8);
}

.a11ytb-quick__profile[aria-pressed='true'] {
  color: #ffffff;
  background-color: var(--a11ytb-accent, #0b4fd8);
  border-color: var(--a11ytb-accent, #0b4fd8);
}

.a11ytb-quick__profile[aria-pressed='true'] .a11ytb-quick__profile-tick {
  display: inline;
}

.a11ytb-quick__profile-tick {
  display: none;
}

.a11ytb-quick__custom {
  display: inline-flex;
  align-items: center;
  min-block-size: 32px;
  padding: 0.3rem 0.65rem;
  font-size: 0.86rem;
  font-style: italic;
  color: var(--a11ytb-muted, #545a6b);
  border: 1px dashed var(--a11ytb-border, #dfe3ec);
  border-radius: 999px;
}

.a11ytb-quick__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-block-start: 0.5rem;
}

/* ── Category sections ──────────────────────────────────────────────────── */
.a11ytb-category {
  margin-block-end: var(--a11ytb-block-gap);
}

.a11ytb-category__heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.15rem;
  font-size: 1rem;
  font-weight: 700;
}

.a11ytb-category__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 26px;
  block-size: 26px;
  color: var(--a11ytb-accent, #0b4fd8);
  background-color: rgb(11 79 216 / 0.1);
  border-radius: 8px;
}

.a11ytb-category__icon svg {
  inline-size: 16px;
  block-size: 16px;
}

.a11ytb-category__description {
  margin: 0 0 0.4rem;
  font-size: 0.85em;
  color: var(--a11ytb-muted, #545a6b);
}

/* ── Feature rows ───────────────────────────────────────────────────────── */
.a11ytb-disclosure__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 22px;
  block-size: 22px;
  color: var(--a11ytb-accent, #0b4fd8);
}

.a11ytb-disclosure__icon svg {
  inline-size: 15px;
  block-size: 15px;
}

.a11ytb-disclosure__button {
  gap: 0.5rem;
  min-block-size: 48px;
  /* The row starts at the section inset; the chevron and icon form a fixed leading
     slot inside it, and the description below is indented by the same slot so the
     feature's title and its description share one left edge. */
  padding-inline: 0;
  font-size: 0.95rem;
}

.a11ytb-disclosure__region {
  padding: 0.6rem 0 0.25rem;
}

.a11ytb-disclosure__summary {
  display: block;
  margin: 0;
  padding-inline-start: var(--a11ytb-disclosure-lead);
  font-size: 0.84em;
  line-height: 1.4;
  font-weight: 400;
  color: var(--a11ytb-muted, #545a6b);
  text-align: start;
}

/* ── Audit summary ──────────────────────────────────────────────────────── */
.a11ytb-audit-summary {
  margin-block-end: var(--a11ytb-block-gap);
  padding: 0.85rem 0;
  background-color: var(--a11ytb-surface, #f1f2f6);
  border-radius: var(--a11ytb-card-radius);
}

.a11ytb-audit-summary__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.35rem 0 0.5rem;
  padding: 0;
  list-style: none;
}

.a11ytb-audit-summary__count {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.82rem;
  /* Token background for the same reason as the profile chips. */
  background-color: var(--a11ytb-bg, #ffffff);
  border: 1px solid var(--a11ytb-border, #dfe3ec);
  border-radius: 999px;
}

.a11ytb-audit-summary__count strong {
  font-size: 1.05em;
}

/* ── Responsive: bottom sheet on small screens ──────────────────────────── */
@media (max-width: 30rem) {
  .a11ytb-root[data-corner='right-middle'] {
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 0.5rem;
  }

  .a11ytb-widget {
    inline-size: 100%;
    max-block-size: 80dvh;
    border-end-end-radius: 0;
    border-end-start-radius: 0;
  }

  /* The launcher stays in the flow, just above the sheet: it keeps a 44px target,
     stays visually attached to the widget, and does not sit on top of the page's own
     header or navigation. */
  .a11ytb-launcher--circle {
    inline-size: 44px;
    block-size: 44px;
  }
}

/* High zoom / narrow viewport: never scroll horizontally. */
@media (max-width: 22rem) {
  .a11ytb-widget__body {
    padding-inline: 0.7rem;
  }
}

/* ── Forced colours and contrast preferences ────────────────────────────── */
@media (forced-colors: active) {
  .a11ytb-launcher--circle {
    color: ButtonText;
    background-color: ButtonFace;
    background-image: none;
    border: 2px solid ButtonText;
  }

  .a11ytb-widget,
  .a11ytb-quick,
  .a11ytb-audit-summary,
  .a11ytb-quick__profile,
  .a11ytb-widget__close {
    border: 1px solid CanvasText;
    forced-color-adjust: auto;
  }

  .a11ytb-quick__profile[aria-pressed='true'] {
    color: HighlightText;
    background-color: Highlight;
  }

  .a11ytb-launcher__dot {
    box-shadow: 0 0 0 2px CanvasText;
  }
}

@media (prefers-contrast: more) {
  .a11ytb-widget,
  .a11ytb-quick__profile,
  .a11ytb-widget__close {
    border-width: 2px;
  }
}

/* The toolbar's own reduced-motion rules already neutralise transitions inside the
   widget; this covers the case where accessibility.css is used on its own. */
@media (prefers-reduced-motion: reduce) {
  .a11ytb-launcher--circle {
    transition: none;
  }

  .a11ytb-launcher--circle:hover,
  .a11ytb-launcher--circle:active {
    transform: none;
  }
}`;

export { WIDGET_STYLES };
export default WIDGET_STYLES;
