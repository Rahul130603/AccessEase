# Integration review — 14 features

Scope, method, findings, fixes and the tests that still have to be run by a human. Written
against the module as it stands after the fixes in section 3.

**No conformance claim.** Everything below is a statement about what the module's code does
and what its automated gates check. WCAG conformance is a property of a *page*, judged by
testing that page — including content and third-party code this toolbar does not control.
Section 6 maps relevant success criteria to features and marks each one honestly.

---

## 1. What was actually executed

These ran in the review environment and their output is what is reported here. Nothing else in
this document is a test result.

| Gate | Command | Result |
|---|---|---|
| Module integrity (relative imports, named/default imports, re-exports, duplicate exports in the entry point) | `node src/accessibility/integration/selfTest/moduleCheck.mjs` | **121 files, no import or export problems** |
| Settings logic (schema, clamping, migration, corrupt payloads, export/import, reset scopes, undo, profiles, widget wiring) | `node src/accessibility/integration/selfTest/settingsSelfTest.mjs` | **31/31 checks passed** |
| Integration review (8 static checks, section 2) | `node src/accessibility/integration/selfTest/integrationReview.mjs` | **117 files, 0 errors, 0 warnings** |
| Syntax of every plain JS/MJS module | `node --check` per file | **61 files clean** |
| JSX structure, brace balance, import resolution over all module files | static scan | **117 files, 0 problems** (plus the demo: 2 files, 0 problems) |
| Stylesheet mirror (`accessibility.css` vs its shadow-root copy) | inside the self-test | **byte-identical** |
| Review-checker mutation test | run against a copy with injected violations | **all detected**: same-file duplicate ids, cross-file duplicate id (warning), lowercase `class`, uncontrolled `value`, unscoped `body` selector, missing `key`; clean again on the real module |
| `!important` audit | grep across the module | confined to `core/apply/forcedStyles.js` (justified per stylesheet) and the shadow-scoped `ui/styles/reducedMotion.js` |
| Storage audit | grep across the module | outside `core/storage.js`, only comments and copy mention storage |

**Correction, added after the bundler run in section 12.** The `moduleCheck` row above was
over-claimed. Its import/export *specifier* checks were inert (the checker stripped string
contents before scanning, and specifiers are string literals), so “no import or export problems”
was only ever evidence about named exports, not about paths. Running the real bundler found two
broken import paths immediately. Section 12 has the detail and the corrected claim.

## 2. What was inspected, and by what

The eight checks in `integrationReview.mjs` were written for this review and are kept as a CI
gate. Each one answers a question from the brief; the calibration problems they had at first are
themselves part of the findings (section 3, D6).

| Check | Question |
|---|---|
| `duplicate-id` | Do two JSX files use the same literal `id`, which would break `aria-labelledby` / `htmlFor` associations? |
| `settings-name`, `meta-name`, `copy-name` | Does every `settings.group.key`, `meta.key` and `strings.group.key` the code references actually exist? |
| `react-attribute` | Any lowercase `class`, `for`, `tabindex`, `autocomplete`, … in JSX (a React warning that silently does nothing)? |
| `css-scope` | Is every static selector rooted at `.a11ytb-*`, `:host` or a `data-a11ytb-*` marker, so nothing can leak into a host page? |
| `registry` | Fourteen features, each with a Panel, a capability, WCAG refs and a summary? |
| `focus-coverage` | Does every interactive class in the **light-DOM** stylesheet (which has no generic fallback) carry its own focus rule? |
| `controlled-input` | Any `value`/`checked` without `onChange`, `readOnly` or `disabled`? |
| `list-key` | Any `.map()` returning JSX without a `key`? |

Also read by hand, because no checker substitutes for reading: the launcher/panel state machine,
the settings and audit providers, the announcer, the appliers, the confirm service, the profile
matcher, and every panel's interaction handlers.

## 3. Findings and fixes

### Confirmed product defects — fixed

**D1 — `HeadingOutline` looked up the wrong copy path** (severity: low, real)
`features/headings/HeadingOutline.jsx` used `strings.outlineEmpty` in `handleJump`, but inside
that component `strings` is the full copy table; the outline strings live under
`strings.headingsLandmarks`. For a heading with no text the announcement read
“Highlighted on the page: {label}.” with the placeholder left in. The same file also passed its
copy table through a prop named `strings`, which is what made the mistake easy to write and made
the first checker run flag five paths instead of one.
*Fix:* the prop is now `copy`, and the lookup is `copy.outlineEmpty`.

**D2 — app-owned components used classes that only exist in the shadow stylesheet** (severity:
medium, real)
`patterns/AuthForms.jsx` and `patterns/ReviewAndConfirm.jsx` render into the *application's* tree
but used `a11ytb-button`, `a11ytb-button-row`, `a11ytb-hint` and `a11ytb-status`, which were only
defined in `ui/styles/primitives.js` — CSS that never leaves the shadow root. The buttons
therefore had no 44px target size, no border and no toolbar focus styling. Separately,
`.a11ytb-form__submit` and `.a11ytb-link-button` had styles but **no `:focus` rule at all** — the
light-DOM stylesheet has no generic fallback, unlike the shadow root.
*Fix:* `patterns/appStyles.js` now defines those four shared class names for the light DOM and
adds `:focus-visible` rules for the submit and link buttons. The `focus-coverage` check now
enforces this: light-DOM interactive classes must carry their own focus rule, shadow-root ones
are covered by the generic rule (whose presence is asserted).

**D3 — `FormErrorSummary` had a fixed default id** (severity: low, real)
The default `id="a11ytb-error-summary"` meant two forms on one page produced duplicate ids, so
anything addressing the second summary could reach the first.
*Fix:* a per-instance id from `useId()`; the documented `id` prop still overrides it.

**D4 — static ids in the widget and panels would collide if the module were mounted twice**
(severity: low, real)
`a11ytb-quick-*` (four group headings), `a11ytb-category-*` (four category headings),
`a11ytb-all-settings`, `a11ytb-quick-check`, and the label/input pairs in the preferences and
profiles panels were literals.
*Fix:* all derived from `useId()`, so `aria-labelledby` and `htmlFor` always point inside their
own instance.

**D5 — a missing feature panel would have crashed the widget** (severity: defensive)
`AccessibilityPanel` rendered `<feature.Panel />` unconditionally. The registry check guarantees
fourteen panels today, but a future edit that drops one would break the whole panel.
*Fix:* the panel renders a short diagnostic message instead, with its own copy key.

### Tooling defects found while calibrating the review — fixed

**D6 — the reviewer was wrong five times before it was useful.** Each was a false positive or a
silently inert check, and all are now covered by the mutation test in section 1:

1. CSS authored in JS template literals was read from the raw file, so JS statements were
   reported as “unscoped selectors” and the light-DOM stylesheet was invisible to the focus check
   — which is why the real focus gap in **D2** was invisible to the first run.
2. JSDoc prose containing backticks was mistaken for CSS.
3. Selector lists were split on every comma, including commas inside `:is(button, input, …)`.
4. `\n` escapes inside CSS constants were treated as literal characters, so scoped selectors
   looked unscoped.
5. **The id and input-type checks were inert**: attribute values were stripped before parsing, so
   `id="phone"` and `type="radio"` never matched. The first run's “no duplicate ids” was
   meaningless; it is meaningful now.
6. The duplicate-id rule originally only compared files, so it missed the more serious case of two
   elements with the same id in one file's markup (found by the second mutation test). It now
   errors on same-file duplicates, warns on cross-file ones, and skips `integration/tests/` —
   each unit test renders its own document, so a reused fixture id cannot collide.

## 4. Feature-by-feature status

“Wired” = present in the registry with a panel, a category, an icon and copy, verified by the
gates in section 1. “Needs manual” = cannot be verified without a browser and a screen reader.

| # | Feature | Wired | Mechanically verified | Needs manual |
|---|---|---|---|---|
| 1 | Flashing content protection | ✓ | animation inventory, estimator thresholds, allowlist persistence, guard lifecycle, revert paths (self-test + static) | detection against real animations, video/GIF/canvas blind spots |
| 2 | Brightness / colour intensity | ✓ | range clamping, filter composition/restore, counter-filter on the host, reset | perceived readability, forced-colors interaction |
| 3 | Screen reader compatibility | ✓ | audit is read-only (no DOM writes except the temporary highlight), 6 checks registered, findings/counters | whether any page's semantics are actually correct |
| 4 | Image alternative text | ✓ | missing-`alt` and file-name-`alt` detection, never writes a description, component fails loudly in dev | whether a description is *accurate* (never automatable) |
| 5 | Accessible form labels | ✓ | `aria-describedby`/`aria-invalid` wiring, label association by `htmlFor`, orphan-label detection | label wording quality |
| 6 | Headings and landmarks | ✓ | outline build, level-skip and missing-`main` detection, node-relative ids (D4) | whether the structure matches the content |
| 7 | Status announcements | ✓ | one service, dedupe + verbosity gates, log records *dropped* messages, `aria-atomic` handling | actual screen reader output, duplicate perception |
| 8 | Accessible error messages | ✓ | message association, `aria-invalid`, summary focus, single channel by default (D3 fixed) | whether a message actually helps someone |
| 9 | Show / hide password | ✓ | type switch preserves value, `aria-pressed`, `aria-controls`, state announced without the value | password-manager and paste behaviour in a real browser |
| 10 | Accessible authentication | ✓ | autocomplete/`off`/paste-blocker detection, no credential in settings/export (asserted) | real login flows, autofill offers |
| 11 | Confirmation before important actions | ✓ | single dialog service, fails closed without a provider, no implicit submission | focus trap and modality in a browser |
| 12 | Save preferences | ✓ | adapters and degradation, clamping, migrations, corrupt payloads, export/import, round trip | cross-tab sync, private-mode behaviour |
| 13 | Reset settings | ✓ | scoped resets, preserved profiles/allowlist, one-step undo, purity | the visible effect on the page |
| 14 | Accessibility profiles | ✓ | built-in patches, Custom transition, unlisted groups untouched, config overrides, user profiles | whether a profile helps a particular person |

## 5. Heuristic vs manual

The distinction the module puts in its own UI (`certainty: detectable | needs-review`) is the
same one this review uses:

| Mechanically detectable (heuristic, can be wrong about intent) | Requires human review |
|---|---|
| An `<img>` with no `alt` attribute at all | Whether a description is accurate, complete or useful |
| An icon-only link/button whose computed name is empty | Whether an image is decorative |
| `alt` text that is literally the file name | Whether alt text duplicates nearby text acceptably |
| A control with no accessible name; a `<label for>` pointing at a missing id | Whether a label's wording is understandable |
| `aria-invalid="true"` with nothing described | Whether an error message helps someone recover |
| Blocks that *look* like error messages that no field points at | Whether the error text is correct |
| Level jumps, empty headings, `aria-hidden` on headings, missing `main`, unnamed repeated landmarks | Whether the heading levels match the content's structure |
| Text styled like a heading that is not one | Whether it *should* be a heading |
| Missing/incorrect `autocomplete`, `autocomplete="off"`, inline paste blockers on credential fields | Whether a login flow is usable; whether a challenge is a cognitive test |
| Captcha/puzzle and “type the nth character” signals | Whether an alternative is genuinely available |
| Flash rate and area estimates from animation timing | Whether content is hazardous in practice; video/GIF/canvas/iframe content |
| Colour-only signalling absent (we never rely on colour) | Contrast ratios in the page's own colours |

## 6. WCAG 2.2 AA mapping

Status vocabulary: **code** = mechanism exists and is covered by the gates in section 1;
**pattern** = delivered for module-rendered UI only (the page's own code is the app's job);
**audit** = reported, not repaired; **manual** = cannot be confirmed without browser/AT testing.

| SC | Level | Where it applies | Status |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Alt-text audit + `AccessibleImage` | audit + pattern; description quality **manual** |
| 1.3.1 Info and Relationships | A | Headings/landmarks audit, field components, landmarks in the panels | audit + pattern |
| 1.3.5 Identify Input Purpose | AA | Auth examples, audit of `autocomplete` | pattern + audit; autofill behaviour **manual** |
| 1.4.1 Use of Color | A | Error text carries “Error: ” and a dashed border; status never colour-only | code |
| 1.4.3 Contrast (Minimum) | AA | Widget's own UI uses documented token contrast; the page's colours are the author's | pattern for the widget; page **manual** (filters are not a fix) |
| 1.4.4 Resize Text | AA | Percentage-based panel sizing, no fixed pixel text | code; page **manual** |
| 1.4.10 Reflow | AA | Panel caps its height and becomes a bottom sheet at 320px; no horizontal scrolling | code |
| 1.4.11 Non-text Contrast | AA | Focus rings, borders, switch and toggle states use currentColor / system colours | code; **manual** confirmation of ratios |
| 1.4.12 Text Spacing | AA | The panel tolerates user spacing overrides; **the module ships no text-spacing controls** | partial — gap recorded |
| 1.4.13 Content on Hover or Focus | AA | No hover-only content; hints are always visible text | code |
| 1.2.2 / 1.2.3 Captions, audio description | A | Not covered by any of the 14 features | gap — out of scope |
| 2.1.1 Keyboard | A | Every control is a native button/input/select; no pointer-only interaction | code; traversal **manual** |
| 2.1.2 No Keyboard Trap | A | Non-modal panel — Tab can always leave; dialog traps focus deliberately and exits on Escape | code; **manual** |
| 2.2.1 Timing Adjustable | A | Nothing times out; announcements are not timed; the reset undo window is announced and optional | code |
| 2.2.2 Pause, Stop, Hide | A | Motion controls, pause/finish strategies, autoplay-media pause | code + audit |
| 2.3.1 Three Flashes | A | Estimator with the 3/second and area thresholds; authoring pattern | audit + pattern, **heuristic** |
| 2.4.1 Bypass Blocks | A | Skip-link detection; `SkipLink`/`Main` components | audit + pattern |
| 2.4.3 Focus Order | A | Panel opens with focus inside, closes back to the launcher; DOM order matches visual order | code; **manual** |
| 2.4.6 Headings and Labels | AA | Heading outline, unnamed-landmark detection, label audit | audit |
| 2.4.7 Focus Visible | AA | Generic shadow focus rule + per-class rules in the light DOM (D2 fixed) | code; **manual** confirmation |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Toolbar is edge-anchored and collapses; dialogs use the top layer | code; **manual** |
| 2.5.7 Dragging Movements | AA | No drag-only interaction anywhere | code |
| 2.5.8 Target Size (Minimum) | AA | 24px floor, 44px for primary controls; light-DOM buttons fixed to 44px in D2 | code |
| 3.2.6 Consistent Help | A | The launcher stays in one place across pages | code |
| 3.3.1 Error Identification | A | Error text + `aria-invalid` + association | pattern + audit; wording **manual** |
| 3.3.2 Labels or Instructions | A | Label audit, field components, hints via `aria-describedby` | pattern + audit |
| 3.3.3 Error Suggestion | AA | Messages are corrective text by construction; fix examples for page errors | pattern + audit |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Confirm dialog + review step; reset is confirmed and undoable | code; **manual** |
| 3.3.7 Redundant Entry | A | Session-scoped, opt-in, non-sensitive recall; preferences avoid re-entry | code |
| 3.3.8 Accessible Authentication (Minimum) | AA | Audit of paste blockers/`autocomplete`, password toggle, alternatives in the examples, no secrets stored | audit + pattern; the site's own flow **out of reach** |
| 4.1.2 Name, Role, Value | A | Native semantics first; `aria-*` only where HTML cannot express it; audit for missing names | code + audit |
| 4.1.3 Status Messages | AA | One announcer service, polite/assertive regions, verbosity and dedupe | code; **manual** |

Recorded gaps, deliberately: no captions/audio-description feature (1.2.x); no text-spacing
controls (1.4.12); the audit cannot assess contrast (1.4.3) or the accuracy of any text it reads.
The module also cannot fix a site it does not own — authentication flows, third-party widgets,
iframe content and server-side error handling are outside any toolbar's reach.

## 7. Integration contract

* **One public entry point.** `src/accessibility/index.js` exports the widget
  (`AccessibilityModule`, `AccessibilityLauncher`, `AccessibilityPanel`, `AccessibilitySettings`,
  `AccessibilityAudit`), the hooks (`useA11ySettings`, `useA11ySetting`,
  `useEffectiveReducedMotion`, `useAnnounce`, `useConfirm`, `useAudit`), the pattern components
  (`TextField`, `FormErrorSummary`, `PasswordField`, `StatusButton`-family, `AccessibleImage`,
  `SkipLink`, `Main`), the profile and preference helpers, the constants and `WIDGET_STYLES`.
  `moduleCheck.mjs` proves every re-export resolves and that no name is exported twice.
* **The demo imports only the entry point** (`demo/main.jsx`, `demo/DemoPage.jsx`), which is how
  an integration should look. The dev harness imports internals on purpose — it is a fixture for
  testing internals.
* **Teammate isolation unchanged**: the widget's chrome lives in a shadow root created by
  `PanelHost`; page-level effects are limited to the documented set (an inline `filter` on the
  chosen root, one stylesheet per concern with an `a11ytb-*` id, `data-a11ytb-*` markers, two
  light-DOM live regions, the shadow host). The `css-scope` check asserts that no selector can
  reach a host page unintentionally, and the `!important` audit keeps overrides in one audited
  file.
* **Settings API unchanged.** Additive only: the `forms`, `reader` and `profile` groups were
  added; unknown groups from other modules survive a load; a patch can only touch
  `PATCHABLE_GROUPS` and can never write `flashGuard.allowlist`.
* No file outside `src/accessibility/` was modified except the demo, which exists for this
  module.

## 8. Manual testing checklist — keyboard only

Run against the demo site. Stop the moment something needs a pointer.

1. Load the page and press `Tab`. The skip link appears and is visible; `Enter` moves to main.
2. Tab to the launcher: the focus ring is visible against the page background behind it.
3. `Enter` opens the panel; focus lands inside it; the dialog is announced with its name.
4. `Tab` through the panel in order: close → profile chips → motion switches → sliders →
   preferences buttons → page-check buttons → four category headings → fourteen feature
   disclosures. Every stop shows a visible ring.
5. On a slider: `←/→` change by one step, `Page Up/Down` by more, `Home/End` to the limits, and
   the value is announced on change (debounced, not per key repeat).
6. On the flashing-protection controls: `Space` toggles the switch; the state changes and is
   announced once.
7. Open a finding's “How to fix this” with `Enter`; the code block is reachable and scrollable.
8. “Show me where” scrolls and outlines the element **without** moving focus; “Move focus there”
   moves focus; continue tabbing from the page element afterwards.
9. Open the confirmation dialog from “Delete account”: focus starts on “Keep the account”;
   `Tab` cycles inside the dialog only; `Escape` cancels and focus returns to the button.
10. In the sign-in form: tab to the password Show button (it follows the field), `Space` toggles
    it, the caret and value survive.
11. Submit the newsletter form empty: focus moves to the error summary; `Tab` to the summary
    link; `Enter` moves focus to the field.
12. Turn on “Also announce errors out loud”, submit again, and confirm you *do* now hear the
    summary twice — that is the documented cost of the option.
13. `Escape` closes the panel from anywhere inside it; focus returns to the launcher.
14. Tab to the end of the panel and keep going: focus leaves into the page (non-modal by design).
15. While the panel is open, click the page: the panel closes and focus is not yanked back.

## 9. Manual testing checklist — screen reader

1. Read the launcher: “Open accessibility settings, button, collapsed”; after opening, “expanded”.
2. The dialog announces its name and the subtitle as its description — once, not twice.
3. Navigate by headings inside the panel: level 2 title, level 3 categories, level 4 features.
4. Read a feature row: the button name, then its description via `aria-describedby`.
5. Toggle a switch: “Reduce motion, switch, on” plus the confirmation announcement.
6. Move a slider: the value in words (“120 percent”), not just a number.
7. Read the page check: counts, then each finding with its severity word, element description,
   evidence and WCAG reference.
8. Trigger “Show me where” and listen: one announcement naming what was highlighted.
9. Press “Preview an announcement” twice quickly: spoken once; the log shows “dropped: duplicate”.
10. Set verbosity to “Only errors and protective actions”, then move a slider: silence, and the
    verbosity confirmation itself was still heard.
11. Submit the newsletter form empty: the summary is read because focus moved to it — no second
    announcement of the same text.
12. In the sign-in form, read the password field with a password manager filling it: label, hint
    and autofill state; the toggle reports “not pressed” then “pressed” plus “Password shown”.
13. Open the confirmation dialog: name, description, then the details list; “Keep the report” has
    focus; browse mode cannot reach the page behind it.
14. Cancel it and confirm the invoking button is announced again.
15. Read the announcement log: plain text, and reading it does not trigger speech.
16. With the OS set to reduce motion, switch to the “Default” profile and confirm the motion
    switch reads “Following your system setting: reduce motion is on”.

## 10. Recommended automated tests

`src/accessibility/integration/tests/` contains three ready-to-run files (Vitest + React Testing
Library + axe) plus setup instructions: `settings.test.js` (adapters, degradation, reset, undo,
clamping, allowlist protection), `widget.test.jsx` (launcher name/state, open/close, Escape, focus
return, dialog naming, all fourteen features, axe), `forms.test.jsx` (error association and single
focus move, summary links, password toggle behaviour, dialog focus, axe).

**They have not been executed** — this environment has no `node_modules` and no network. They are
a recommendation with complete code, and the three Node gates in section 1 are what should run in
CI today.

## 11. Residual risks

* Everything requiring a rendering browser or a real screen reader is still unverified: focus
  visibility, focus order, dialog modality, live-region output, autofill, paste, forced-colors,
  400% zoom, and the perceived effect of the visual filters.
* The audit is heuristic by construction. Its findings are labelled `detectable` or
  `needs-review`, and section 5 lists what it can never decide.
* Detection cannot see into video, animated images, canvas, plugins or cross-origin frames, and
  no setting guarantees protection against photosensitive seizures.
* Two accessibility settings gaps are recorded rather than hidden: text spacing (1.4.12) and
  media captions (1.2.x) are not part of the fourteen features.
* The module's own UI has not been through a screen reader in this environment; the panels claim
  APG-shaped behaviour, and sections 8 and 9 are how that claim gets tested.

---

## 12. Post-review verification: the module running in a real bundler

Everything above was static analysis. This section records what happened when the module was
finally built and served, which is the check that matters most and the one I could not run earlier.

Setup added for it (this repository is now a Vite app): `package.json` (React 18.3.1, React DOM
18.3.1, Vite 5.4.21, `@vitejs/plugin-react` 4.7.0), `vite.config.js` with both pages as build
entries, and a `.gitignore`.

### What ran, and what it returned

| Step | Command | Result |
|---|---|---|
| Install | `npm install` | 63 packages, React 18.3.1 / Vite 5.4.21 |
| Production build (compiles both HTML entries through the whole module graph) | `npm run build` | **141 modules transformed, built in 1.15s, exit 0** — `dist/demo/`, `dist/src/accessibility/integration/devHarness/`, CSS and JS chunks emitted |
| Dev server | `npm run dev` | ready in 319 ms, `http://localhost:5173/` |
| HTTP probe of the served pages | `Invoke-WebRequest` | `/demo/` **200** (618 B) · `/src/accessibility/index.js` **200** (41 kB, transformed) · `/src/accessibility/AccessibilityPanel.jsx` **200** (17 kB, transformed) · `/src/accessibility/integration/devHarness/` **200** (753 B) |

### Defects the bundler found that no static gate had

**D7 — the module could not load at all** (severity: critical, real)
`core/confirm/ConfirmContext.jsx` imported `./SettingsContext.jsx` (which is one directory up) and
`../ui/ConfirmDialog.jsx` (two directories up). Both paths were wrong, so the module graph could
not resolve: **every integration would have failed at import time**, in any bundler, before the
widget rendered anything. Fixed to `../SettingsContext.jsx` and `../../ui/ConfirmDialog.jsx`.

**D8 — a bad import in the recommended test suite** (severity: medium, real)
`integration/tests/forms.test.jsx` imported `AccessibilityProvider` from `core/SettingsContext.jsx`,
where it does not exist (it is defined in `AccessibilityModule.jsx` and re-exported from the entry
point). The suite would have failed on import. Fixed to import it from `index.js`.

**D9 — the moduleCheck gate was silently inert** (severity: high, tooling)
`moduleCheck.mjs` stripped all string contents before matching, so every import and re-export
*specifier* was destroyed before the regexes ran. It reported “no problems” for the whole project
while D7 sat in the graph, and the named-export check only appeared to work because identifiers
survive stripping. This also invalidates part of section 1's table, as noted there.
Fixed: comments are stripped, template literals are blanked (so code samples in copy tables are not
mistaken for imports), real specifiers stay intact, and the scan is mutation-tested — removing the
fix from a copy of the module now produces
`✗ unresolved import: ./SettingsContext.jsx in /core/confirm/ConfirmContext.jsx`.

### What this changes about the review's conclusions

* **`npm run build` is now the strongest gate** and belongs in CI, ahead of the static checks: it is
  the only one that resolves the real module graph, transforms every file and would have caught D7
  in a second. `npm run check` (the three Node gates) remains useful because it needs no toolchain.
* The 14 features, the settings pipeline, the profiles and the persistence logic are unchanged by
  this section: D7 was a wiring defect, not a logic defect, and the logic gates were real.
* Sections 8 and 9 (keyboard and screen-reader checklists) are still unrun. The page now loads, so
  they are the next thing to do with a browser and a screen reader.
