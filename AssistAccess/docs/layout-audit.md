# Widget layout audit — findings, fixes and verification

Scope: alignment, spacing, sizing, overflow, scrolling, typography and focus indicators of the
accessibility widget's own chrome and panels. No feature logic, API, DOM structure or visual
design was changed.

The audit was run against **rendered output**, not source: a real Chrome (via `puppeteer-core`,
no downloaded browser) driving the dev server, measuring the widget's shadow DOM at four widths
with every feature expanded, then re-measuring after each fix.

```bash
npm run dev                 # terminal 1
npm run audit:layout        # terminal 2 — screenshots + report.json in tools/layout-audit-out/
```

The audit exits non-zero when it finds something, so it works as a gate. `tools/layout-audit-out/`
(report.json plus one screenshot per width) is gitignored.

## Tooling built for this audit

`tools/layout-audit.mjs` measures, inside the shadow root:

* horizontal overflow of the panel and its scrolling body;
* elements escaping the panel box (scoped to panel descendants — the launcher and the
  click-through layer are supposed to sit outside);
* which screen edge the launcher is anchored to, and the gap between launcher and panel;
* text clipping in blocks that cannot scroll;
* control target sizes, measured through the wrapping `<label>` where one exists;
* left-edge alignment of every text block (headings, descriptions, titles, cards) as pixel
  offsets from the feature title;
* the typography scale of h2/h3/h4/description/hint;
* control box sizes; and the panel body's scroll behaviour;
* keyboard focus: it tabs through the panel and checks each focused control has an outline;
* **axe-core** over the widget in both light and dark colour schemes.

## Root causes fixed

| # | Symptom (measured) | Root cause | Fix |
|---|---|---|---|
| 1 | On a 1440px viewport the whole widget sat at the **left** edge: panel x=8, launcher x=372. | `[data-corner='right-middle']` combined `flex-direction: row-reverse` with `justify-content: flex-end`. In a reversed row the main axis is flipped, so `flex-end` packs to the left. | Layout no longer depends on axis direction or DOM order: `flex-direction: row`, `justify-content: flex-end`, and explicit `order` for the panel and launcher. Now panel x=1012..1364, launcher x=1376..1432 (hard against the edge). |
| 2 | Feature title text sat **55px right** of its own description — the row looked ragged. | The disclosure description was rendered at the section's left edge while the title is pushed right by the chevron + icon. | Added `--a11ytb-disclosure-lead` (the leading slot: chevron + gap + icon + gap), applied to the description. Offset is now **+2.4px** (desktop) and **+0.8px** (mobile). |
| 3 | Panel inputs were 253×21px, borderless, default font, next to 32px controls. | The profile-name field and import file input use `a11ytb-form__control`, defined only in the light-DOM stylesheet (`patterns/appStyles.js`), which cannot reach shadow content. | Styled inside the widget stylesheet: 318×34.2px, 1px border, themed colours, own focus ring. |
| 4 | Inverted hierarchy: feature titles (16px) were larger than their category headings (14.72px). | `.a11ytb-disclosure__heading` inherited 1rem while category headings were 0.92rem. | Title 18.4 → category 16 → feature 15.2 → description 12.6px. |
| 5 | Quick-settings and page-check text sat 16px deeper than the rest of the panel. | Those tinted blocks added their own inline padding on top of the body padding. | They are full-bleed blocks now (`padding-inline: 0`), so their text shares the panel's single text inset. Bounded objects (finding cards, alt-text cards, buttons, chips) keep their internal padding by design. |
| 6 | In dark mode the **inactive profile chips were white-on-white** (and the batch/audit chips, and the alt-text cards). | Hard-coded `background-color: #ffffff` / `#f8fbff` while text and borders came from theme tokens. | Their backgrounds now come from tokens (`--a11ytb-bg`, `--a11ytb-surface`) with the previous colours kept as fallbacks. |
| 7 | At 390px the launcher overlapped the page's own header/nav. | On small screens the launcher was absolutely positioned at the top of the viewport. | It stays in the flow above the bottom sheet, so it keeps a 44px target, stays attached to the widget and covers nothing. |
| 8 | Card radii disagreed (8px for finding cards vs 12px for the other blocks). | The value was hard-coded per rule. | One set of tokens: `--a11ytb-widget-pad`, `--a11ytb-block-gap`, `--a11ytb-card-radius`; finding cards (in `primitives.js`) now use the shared radius. Their inner padding is deliberately kept — see item 2 under remaining issues. |

The other agent's alt-text panel (added in parallel) is included in the audit: its cards were
re-tinted for dark mode and given the shared radius/gap, but its design (preview thumbnail, consent
row, textarea, button order) is untouched.

## Verification after the fixes

| Check | Result |
|---|---|
| Layout audit, 1440 / 1024 / 768 / 390px, all fourteen features expanded | **0 findings** (was 4910, then 96, then 4 — the last four were bugs in the audit itself, see below) |
| Elements escaping the panel / horizontal scrolling | none at any width; `overflow-x` never appears |
| Panel body scrolling | scrolls internally (`overflow-y: auto`, 701px viewport vs 27,972px of content when everything is expanded); the page behind is not scrolled |
| Responsive | desktop: 352×868 panel beside the launcher; 390px: 374×720 bottom sheet with square bottom corners and the launcher above it |
| Control sizes | launcher 56×56 (44×44 on mobile), close 36×36, chips 32px tall, selects 32px, inputs 34.2px, sliders 24px tall |
| Keyboard focus | 25 tab stops through the panel, **0 without a visible outline** |
| axe-core (WCAG 2.0/2.1/2.2 A+AA rules), light | **0 violations**, 21 checks passed |
| axe-core, dark | **0 violations**, 21 checks passed |
| `npm run check` | moduleCheck 125 files clean · integrationReview 121 files, 0 errors · self-test 31/31 (includes the stylesheet-mirror check) |
| `npm run build` | both pages and the embed bundle build clean |

## Re-run after the alt-text work

The AI alt-text feature (see `ALT-TEXT-INTEGRATION.md`) added a rescan when an image finishes
loading, new test fixtures and new test scripts. It changed no CSS, no design token and no layout
code. The gate was re-run against the built output served from `dist/` and reports the same numbers:
**0 findings** at 1440 / 1024 / 768 / 390px, panel 352×868 (374×720 on the 390px bottom sheet), 0
axe-core violations in light and dark, and 25 keyboard stops with 0 missing outlines. The alignment
offsets are unchanged (feature title vs description 2.4px at ≥768px, 0.8px at 390px; the deliberate
~52px heading indent), so the fixes in the table above are intact.

Two browser suites now also assert bounds for the **`bottom-right`** corner used by `test-host/`
(previously unmeasured): the panel stays inside the viewport at 764px and, as a bottom sheet, at
375px. Their measurement is coarse — they check containment, not alignment or anchor edge — so the
caveats in item 4 below still stand for the remaining corner presets.

## Remaining issues and deliberate choices

1. **Feature titles are indented ~52px from category headings.** This is the accordion convention:
   the row's leading slot (chevron + icon) is part of the control, and the description and expanded
   content align with the title. It is identical on every row. Flattening it would mean removing the
   chevron or the icon, i.e. redesigning the row.
2. **Bounded objects keep their own inner padding** (finding cards, alt-text cards, chips, inputs).
   Text blocks share one inset; a card with a border and background is a separate object, and its
   text being inset from surrounding text is intentional. The audit reports these as expected
   differences rather than failures.
3. **The audit's own checker had four defects**, each found by cross-checking measurements against
   an independent diagnostic and against the screenshots: CSS read from JS template literals as if
   it were the file (made a real gap invisible), a `-420px` false anchor failure caused by
   `'right-middle'.endsWith('right')` being false, small-target failures for inputs measured instead
   of their wrapping labels, and clipped-text failures for the intentionally clipped
   visually-hidden spans. All four are fixed and the gate now verifies the widget, not itself.
4. **Only the `right-middle` corner was measured in the browser.** The other four corner rules were
   not touched by this work, and the host page in `test-host/` uses `bottom-right` but loads the
   embed bundle from a path the dev server does not serve (`/embed/assistaccess.js` is built to
   `dist/embed/`), so it needs its own serving step to audit.
5. **Dark-mode contrast was found by looking at the rendered screenshot**, not by axe — the axe step
   only became runnable afterwards. axe passing in both schemes now is a regression guard, not proof
   that the earlier defect would have been caught automatically.
6. **Theme-dependent rendering.** Headless Chrome defaults to dark, so the audit now pins
   `prefers-color-scheme` explicitly (light for layout, both for axe). Layout numbers are identical
   in both schemes; only colour changes.

## Manual re-check

1. `npm run dev`, open `/demo/`, and confirm the launcher is a blue circle on the **right** edge,
   vertically centred.
2. Open it: the panel appears beside the button, not over it, and does not extend past the viewport.
3. Expand every category in turn: icon, title and description of each row line up; long code blocks
   and textareas scroll inside themselves instead of widening the panel.
4. Tab from the panel title to the last control: every stop shows a visible ring.
5. Narrow the window to ~390px: the panel becomes a bottom sheet, the launcher sits above it, and
   nothing overlaps the page header.
6. Switch the OS to dark mode (or DevTools → Rendering → prefers-color-scheme: dark): the profile
   chips, count pills and alt-text cards must stay readable.
