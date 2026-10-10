# Reader phase — integration & test guide

Five features added on top of the existing module, without changing the behaviour of the
flashing-guard or visual-adjustment features:

| # | Feature | What it actually does |
|---|---|---|
| 1 | Screen reader compatibility | Read-only page audit: reports what the DOM proves, lists what needs a human decision, copies a plain-text report |
| 2 | Image alternative text | Finds images with no `alt` and icon controls left unnamed; shows meaningful vs decorative examples; **never writes a description** |
| 3 | Accessible form labels | Finds unlabelled controls, placeholder-only fields, orphan labels, unnamed option groups; ships field components that get labels right in markup |
| 4 | Accessible headings and landmarks | Navigable heading outline (nested lists), missing/hidden heading and missing-main findings, skip-link/main/section components |
| 5 | Screen reader status announcements | Verbosity setting, navigation-change announcements, and a log of what was announced — including what was dropped as a duplicate |

Two rules run through all five, and they are the reason the panel copy is worded the way it is:

* **Report, do not repair.** The audit never sets an attribute, wraps a node, moves content or
  inserts text into the page. A toolbar that rewrites another team's DOM breaks their validation,
  their tests and their framework's reconciliation, and it hides the real fix.
* **Never invent meaning.** No component writes a description or an accessible name. The audit
  counts that alt text *exists*; it says plainly that this is not a quality score, and it never
  claims a description is accurate.

---

## 1. New files

```
src/accessibility/
  core/
    warnDev.js                          development-only diagnostics for the pattern components
    dom/accessibilityName.js            pragmatic accessible-name computation (returns its source)
    audit/
      findings.js                       finding model: severity + certainty (detectable / needs-review)
      fixExamples.js                    developer code examples, one per finding type
      reportText.js                     plain-text report builder
      auditEngine.js                    read-only scan, throttled by the shared DOM observer
      AuditContext.jsx                  one audit shared by every reader panel
      checks/
        checkImageAlt.js                missing alt, unnamed icon controls, file-name alt
        checkFormLabels.js              missing names, placeholder-only, orphan label, group label
        checkHeadings.js                missing/empty/hidden headings, level jumps, fake headings, outline
        checkLandmarks.js               missing/multiple main, unnamed navigation, skip link
        index.js                        AUDIT_CHECKS registry + per-check metadata
    a11y/routeAnnouncer.js              SPA route/title change announcements (reversible history patch)

  ui/
    StatusMessage.jsx                   visible, self-announcing live region (role=status / alert)
    LiveAnnouncement.jsx                invisible self-announcing region
    visuallyHiddenStyle.js              the visually-hidden pattern, defined once

  features/
    screenReader/ScreenReaderPanel.jsx  feature 1 panel
    screenReader/FindingList.jsx        shared finding renderer (severity, evidence, jump, fix example)
    altText/AltTextPanel.jsx            feature 2 panel
    formLabels/FormLabelsPanel.jsx      feature 3 panel
    headings/StructurePanel.jsx         feature 4 panel
    headings/HeadingOutline.jsx         nested heading outline navigator
    announcements/AnnouncementsPanel.jsx feature 5 panel
    announcements/RouteAnnouncer.jsx    renders nothing; keeps navigation announcements running

  patterns/                             components the APPLICATION renders (light DOM)
    appStyles.js                        namespaced styles for those components (ref-counted, no !important)
    FormField.jsx                       Field, useField, FieldHint, FieldError, useFieldErrorAnnouncement
    fields.jsx                          TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField
    AccessibleImage.jsx                 AccessibleImage, Figure (alt decision enforced)
    PageStructure.jsx                   SkipLink, Main, Section
```

Modified files (additive only — the flashing and visual features were not touched):

| File | Change |
|---|---|
| `constants.js` | five new feature ids, `READER`/`FORMS` groups, `ANNOUNCEMENT_LEVELS`, `AUDIT_LIMITS`, audit/announcement events and style ids |
| `core/settingsSchema.js` | new `reader` group: `auditEnabled`, `announceVerbosity`, `announceRouteChanges`, `highlightOnJump` |
| `core/settingsReducer.js` | `SET_READER` action with enum/boolean validation |
| `core/SettingsContext.jsx` | `actions.setReader()`, verbosity wiring, `meta.verbosity` |
| `core/a11y/announcer.js` | announcement levels + verbosity gate + announcement log + `subscribeAnnouncements` |
| `core/dom/domRegistry.js` | `subscribeToDomChanges()` — one shared observer for audit + route announcer |
| `core/dom/domScope.js` | `isNaturallyFocusable()`, `isTabbable()` |
| `core/apply/forcedStyles.js` | `buildAuditHighlightCss()` + justification entry |
| `strings.js` | copy for all five features |
| `features/registry.js` | five feature descriptors |
| `AccessibilityModule.jsx` | wraps the chrome in `AuditProvider`, mounts `RouteAnnouncer` |
| `index.js` | public exports for the new components and audit API |
| `ui/styles/primitives.js` | styles for findings, code examples, outline, log, examples |

---

## 2. Integration

### 2.1 Nothing to do beyond updating the folder

`<AccessibilityModule>` now mounts the audit provider and the route announcer itself. The five
features appear as panels in the toolbar; no new configuration is required.

```jsx
<AccessibilityModule config={{ ... }}>
  <YourApp />
</AccessibilityModule>
```

Optional configuration:

```jsx
<AccessibilityModule
  config={{
    features: { disabled: ['form-labels'] },   // hide a reader feature
    strings: { audit: { intro: 'Our own wording.' } },
  }}
/>
```

### 2.2 Use the hooks in your own components

```js
import { useAudit, useAnnounce, useA11ySettings } from './accessibility';

const audit = useAudit();      // { findings, outline, counters, summary, rescan, jump, jumpToElement, enabled }
const announce = useAnnounce(); // (message, { politeness, level, dedupeKey }) => void
const { settings, actions } = useA11ySettings();
actions.setReader('announceVerbosity', 'minimal');
```

`useAudit()` returns `null` when the provider is not mounted — guard for it if you use these
components outside `<AccessibilityModule>`.

### 2.3 Fix the page with markup, not with the toolbar

```jsx
import {
  SkipLink, Main, Section,
  AccessibleImage, Figure,
  TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField,
  StatusMessage, LiveAnnouncement,
} from './accessibility';

<SkipLink targetId="main" />
<Main id="main">
  <h1>Account settings</h1>
  <Section level={2} heading="Billing">
    <TextField label="Email address" type="email" hint="For your receipt only"
               error={errors.email} required value={email} onChange={setEmail} />
    <RadioGroupField legend="Delivery speed" name="speed" value={speed} onChange={setSpeed}
                     options={[{ value: 'standard', label: 'Standard, 3-5 days' },
                               { value: 'express', label: 'Express, next day' }]} />
    <AccessibleImage src="/q4.png" alt="Revenue by quarter: Q4 is highest at 3.4 million" />
    <AccessibleImage src="/divider.svg" decorative />
    <StatusMessage>{saved ? 'Draft saved' : ''}</StatusMessage>
  </Section>
</Main>
```

These components render real semantic markup (`label`, `fieldset`/`legend`, `figure`/`figcaption`,
`main`, `nav`), add only the ARIA that HTML cannot express (`aria-describedby`, `aria-invalid`,
`aria-labelledby` on a named section), and never remove a focus indicator. Their stylesheet is
namespaced (`.a11ytb-form__*`, `.a11ytb-skip-link`, `.a11ytb-figure`), injected once, ref-counted,
and free of `!important` — override it with your own design system freely.

### 2.4 Events

New window events: `a11ytb:audit-updated` (`{ summary, counters, ranAt }`) and
`a11ytb:announcement` (one announcement-log entry).

---

## 3. What the audit detects, and what it refuses to decide

| Check | Detectable (reported as a problem) | Needs a human decision (reported as a signal) |
|---|---|---|
| Image alt text | No `alt` attribute; an icon-only link/button left with no accessible name; `alt` that is literally the file name (warning) | Whether a description is accurate or complete; whether a large image with `alt=""` is really decorative; whether alt text duplicates a caption |
| Form labels | No accessible name on a control; placeholder-only; `<label for>` pointing at a missing id; option group with no group label | Whether a name is descriptive; whether `title` is an acceptable name; whether a visible label must match the accessible name (reported when it demonstrably does not — WCAG 2.5.3) |
| Headings | No headings at all; empty heading; heading hidden with `aria-hidden`; `role="heading"` without a usable level | Whether a page needs an `h1`; whether a level jump is intentional; whether styled text should be a heading |
| Landmarks | No `main`; more than one visible `main`; two or more navigation landmarks with no name to tell them apart | Whether a navigation landmark is needed; whether a skip link is needed for this content order |

The panel always shows these two groups separately, the report text does the same, and the
`certainty` field carries the distinction in the data so no UI can blur it by accident.

**What the audit cannot detect at all** (shown in the panel): accuracy of alt text, colour
contrast, whether a custom widget truly works with a keyboard or screen reader, content inside
cross-origin frames/plugins/canvas/video/images of text, clear instructions, useful error messages,
timing, media captions — and anything that requires listening to the page with a real screen reader.

---

## 4. Announcements: one message, one channel

| Situation | Use | Why |
|---|---|---|
| Something visible on screen changed ("Draft saved", "3 results") | `<StatusMessage>` | The region is the announcement; no service call, so it cannot be duplicated |
| An error that must interrupt | `<StatusMessage role="alert">` | Assertive, used sparingly |
| Nothing visible to show | `useAnnounce()` / `announce()` | Shared service: deduplicated, coalesced, respects the user's verbosity setting |
| A widget used outside `<AccessibilityModule>` | `<LiveAnnouncement>` | Self-contained region, no provider needed |

Mechanics that make it reliable:

* **Region before message.** `StatusMessage` renders an empty region first and fills it on the next
  tick. A region that appears together with its text is routinely missed by screen readers.
* **`aria-atomic="true"`.** Set explicitly on both components, so the whole sentence is read rather
  than only the part that changed.
* **Role over redundant ARIA.** `role="status"` already implies `aria-live="polite"`, so no
  `aria-live` is added. `role="none"` exists for the rare case where an explicit `aria-live` is
  genuinely needed.
* **Dedupe and verbosity.** The service drops an identical message within 1.5 s and a message whose
  level is above the user's verbosity. Both are recorded in the log as *dropped*, which is how the
  user can verify the policy instead of trusting it.
* **Levels.** `critical` (errors, protective actions) always speaks; `standard` (the user's own
  state changes) is the default; `verbose` (scan progress, details) is suppressed unless asked for.
  The message that *switches to minimal* is announced at `critical` level so it is still heard.

---

## 5. Keyboard test cases

Run these in the dev harness (section 6) with a keyboard only. Expected result in brackets.

**Toolbar itself**

1. `Tab` from the top of the page → the skip link appears on screen when focused. `Enter` → focus
   moves to the main landmark. [Focus visibly moves; no scroll jump confusion]
2. `Tab` to the "Accessibility options" launcher, press `Enter`. [Panel opens, focus lands inside
   the panel, the dialog is announced with its name]
3. In the panel, `Tab` through the disclosures. Press `Enter` on "Screen reader compatibility".
   [`aria-expanded` flips, the region opens]
4. `Tab` to "Show me where" and press `Enter`. [The finding's element is scrolled into view and
   outlined; the announcement says what was highlighted; **focus stays in the panel**]
5. `Tab` to "Move focus there" (only present for focusable elements) and press `Enter`. [Focus moves
   to the page element; `Shift+Tab` / `Tab` continues from there]
6. Inside a fix example, press `Enter` on the `<summary>`. [Details expand; the code block is
   reachable and horizontally scrollable if long]
7. `Esc` inside the panel. [Panel closes, focus returns to the launcher]
8. Tab to the end of the panel and keep pressing `Tab`. [Focus leaves the panel into the page — the
   dialog is non-modal and must not trap focus]
9. On the verbosity radio group, use `↑`/`↓` to change the option. [The selection moves; the change
   is announced once]
10. On a slider or switch inside the panel, press `Space`. [State changes and is announced once]

**Audit findings**

11. Press "Check the page again". [The summary is announced once; the status line updates without
    stealing focus]
12. Press "Copy report". [Announcement confirms the copy; if the clipboard is blocked, the report
    appears in a labelled textarea for manual copying instead of failing silently]
13. Press "Remove the main landmark" in the harness toolbar, then "Check the page again". [A "no main
    landmark" detected problem appears in the report]

**Heading outline**

14. In "Accessible headings and landmarks", `Tab` into the outline. [Each entry is a button with an
    accessible name that includes the heading text; the list is nested, so the level is announced]
15. Press `Enter` on an outline entry. [The heading is scrolled to and outlined]

**Form components**

16. In the "Structure: correct markup" section, `Tab` through the text field, radio group and
    checkbox. [Each control announces its label; the radio group announces its legend once; hints are
    read as descriptions]
17. Submit nothing / trigger the field error with `announceError` enabled. [The error text is
    associated with the field; the announcement happens once]

## 6. Screen-reader test cases

Test with NVDA + Firefox and VoiceOver + Safari (and TalkBack if available).

1. **Launcher and panel.** Read the launcher: [name "Accessibility options", collapsed/expanded
   state]. Open it: [dialog announced with its name; focus inside].
2. **Audit summary.** Read the status line and the summary line: [counts are read as words, not
   abbreviations].
3. **Findings list.** Navigate the list: [list with N items; each item contains the severity text,
   the element description, the message, and buttons named "Show me where: <element>"].
4. **Certainty separation.** Confirm the two headings are read as "Detected problems" and "Needs a
   human decision" before their lists. [A listener can tell a proven problem from a signal]
5. **Evidence.** Confirm that evidence is read as page content ("file: chart.png"), not as an
   instruction from the toolbar.
6. **Fix examples.** Expand a `<summary>` and read the code block. [Announced as text; no invented
   description of the image anywhere in the panel]
7. **Counters caveat.** Read the counters: [the alt-text counter explicitly says "quality not
   checked"].
8. **Limitations.** Read the "What this audit cannot detect" list: [all eight items reachable].
9. **Announcement log.** Open "Screen reader status announcements" and read the log: [entries are
   plain text; the log is **not** a live region, so reading it does not trigger speech].
10. **Duplicate suppression.** Press "Preview an announcement" twice quickly. [Spoken once; the
    second entry in the log says "dropped: duplicate"].
11. **Verbosity.** Set verbosity to "Only errors and protective actions", then change a visual
    setting from the other panel. [No announcement for the slider change; the verbosity-change
    confirmation itself was heard].
12. **Navigation announcement.** Navigate to a hash link in the harness. [The new title/path is
    announced once; the log shows the route entry].
13. **Status message component.** In the harness, press "Save draft". [The visible status message is
    announced once, by the region itself — no duplicate from the toolbar service].
14. **Field errors.** Trigger a field error and read the field. [Label, value and error are read
    together because the error is part of `aria-describedby`].
15. **Shadow DOM boundary.** Confirm no page-facing ARIA references the toolbar's shadow tree: the
    findings and outline are inside the toolbar (fine), and nothing in the page is described by a
    node inside our shadow root.

## 7. Dev harness fixtures

`integration/devHarness/StructureFixtures.jsx` adds, in the running harness:

* **Deliberate defects:** an image with no `alt`; an icon-only link with no accessible name; an image
  using `chart.png` as alt; a large image with `alt=""`; a placeholder-only input; a label pointing
  at a missing id; an unlabelled radio pair; an icon-only button; a heading level jump; an empty
  heading; an `aria-hidden` heading; text styled as a heading.
* **Correct markup:** `TextField`, `RadioGroupField`, `CheckboxField`, `StatusMessage`, `Figure` with
  a described `AccessibleImage`, a decorative `AccessibleImage`, `SkipLink` and a named `Section`.
* **A "Remove the main landmark" toggle** in the harness toolbar, which swaps `<main>` for `<div>`
  so the "no main landmark" finding can be produced and cleared on demand.

Missing images (`structure-photo.png`, `chart-accessible.png`, …) are deliberate: a broken image has
a size box, so the audit still reports it, and no test depends on downloading assets.

## 8. Verification performed

* `node --check` on all 46 plain-JS modules: clean.
* Static check over all 79 `.js`/`.jsx` files: every relative import resolves, no `.css` import
  outside the harness, balanced braces/parens, balanced JSX tags.
* `!important` audit still confined to `core/apply/forcedStyles.js` (justified per stylesheet) and
  the toolbar's own shadow-scoped reduced-motion rules.
* **Not verified:** runtime behaviour. The audit needs a real DOM with layout and computed styles,
  and the announcements need a real screen reader, so the test cases above must be run in a browser.
