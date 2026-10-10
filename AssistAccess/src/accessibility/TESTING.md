# Testing the widget — setup and manual cases for all 14 features

Everything here is runnable by hand against the [demo site](../demo/README.md). The deeper
per-phase guides are [INTEGRATION.md](./INTEGRATION.md) (motion and visual),
[INTEGRATION-READER.md](./INTEGRATION-READER.md) (audit and announcements),
[INTEGRATION-FORMS.md](./INTEGRATION-FORMS.md) (forms, passwords, auth, confirmation) and
[INTEGRATION-PREFERENCES.md](./INTEGRATION-PREFERENCES.md) (persistence, reset, profiles).

---

## 1. Setup

### 1.1 This repository (fastest)

The repository root is a Vite app:

```bash
npm install
npm run dev        # opens http://localhost:5173/demo/
```

* `http://localhost:5173/demo/` — the demo site (four deliberate faults, section 3 below).
* `http://localhost:5173/src/accessibility/integration/devHarness/` — the hostile host app.

### 1.2 Into an existing app

```jsx
import AccessibilityModule from './accessibility/AccessibilityModule.jsx';

<AccessibilityModule config={{ position: { corner: 'right-middle' }, storage: 'auto' }}>
  <App />
</AccessibilityModule>
```

Options worth knowing: `corner` (`right-middle` is the default; `bottom-right`, `bottom-left`,
`top-right`, `top-left` also work), `position.offsetX/offsetY`, `theme` (`--a11ytb-accent` and
friends), `profiles` (extra or overridden profiles), `features.disabled` (hide a feature by id),
`storage` (`auto` | `local` | `session` | `memory`), `strings` (copy overrides), `debug`.

### 1.3 Automated checks (no browser needed)

```bash
node src/accessibility/integration/selfTest/moduleCheck.mjs        # imports and exports resolve
node src/accessibility/integration/selfTest/settingsSelfTest.mjs   # 31 checks: schema, storage, reset, profiles, widget wiring
node src/accessibility/integration/selfTest/syncWidgetStyles.mjs   # regenerates the stylesheet mirror (after editing accessibility.css)
```

The self-test covers what pure logic can prove: clamping and validation, migration, corrupt
payloads, export/import, reset scopes and undo, profile matching and the Custom transition, and
that the fourteen features each have a category and an icon. It does not cover anything needing a
DOM, so the cases below are the real acceptance criteria.

---

## 2. The floating button and the panel

| # | Step | Expected |
|---|---|---|
| 1 | Load the demo. | A circular blue button with a white accessibility symbol sits at the middle of the right edge, above the page content, and stays there while you scroll. |
| 2 | Hover it, then click it. | It lifts slightly on hover; clicking opens the panel beside it, to the left of the button. |
| 3 | Click the button again. | The panel closes. |
| 4 | Tab to the button and press Enter, then Space. | Both open the panel and both close it. The button reports its state (`aria-expanded`). |
| 5 | With the panel open, press Escape. | The panel closes and **focus returns to the button**. |
| 6 | With the panel open, click anywhere on the page. | The panel closes; focus is not stolen back to the button (a pointer press keeps focus where the user put it). |
| 7 | Tab through the whole panel without a mouse. | Every control is reachable in a sensible order (title → close → quick settings → check → categories → features), with a visible focus ring at every step. Tab can leave the panel into the page — it is deliberately non-modal. |
| 8 | Touch: tap the button, tap the page, tap the button. | Open, close, reopen — the touch target is 56×56 CSS pixels. |
| 9 | Zoom to 400% (or set the window to 360×640 and reload). | The panel becomes a bottom sheet that fits the viewport, scrolls internally, and never scrolls horizontally; the launcher moves to the top-right so it stays reachable. |
| 10 | With the panel open, run the display sliders to 150% brightness and 130% contrast. | The page changes; **the panel keeps its own colours and stays readable** (the widget counter-filters its host). |
| 11 | Screen reader: read the button. | “Open accessibility settings, button, collapsed”; after opening, “expanded”, then the dialog announces its name and subtitle. |
| 12 | Screen reader: navigate by headings inside the panel. | Title (level 2) → four category headings (level 3) → the fourteen features (level 4), each announced with its description. |
| 13 | Screen reader: navigate by landmarks on the page. | The widget's own markup does not appear as a page landmark and does not interfere with the page's landmarks. |

---

## 3. The fourteen features

Each table assumes the panel is open. “Announces” means through the shared live region
(light DOM), which is what a screen reader actually reads.

### Motion and sensory

**1. Flashing content protection**

| Step | Expected |
|---|---|
| Watch the promo banner on load. | Within a couple of seconds it stops flashing, and the toolbar announces how many items were paused. |
| Open “Flashing content protection”. | The banner is listed with an estimated flash rate (“about 6.7 flashes per second”), an area estimate, a band label and a confidence note. The slow, non-flashing animations on the page are **not** listed. |
| Press “Allow”. | The banner animates again and stays allowed on this page after a reload. |
| Press “Restore everything this toolbar changed”. | Everything the guard changed is reverted. |
| Switch “When flashing is suspected” to “Hide it”. | The element is hidden and the finding says so; “Restore everything” brings it back. |
| Read the limitation notice. | It states that flashing inside video, animated images, canvas and third-party embeds cannot be detected or reliably stopped, and that no setting guarantees protection against photosensitive seizures. |

**2. Brightness / colour intensity adjustment**

| Step | Expected |
|---|---|
| Move each slider in the quick settings. | The page changes immediately; each slider announces its value once (not on every key repeat). |
| Press Home then End on a slider. | Clamps to 50% and 150% (brightness, contrast) and 0–200% (saturation). |
| Look at the widget while the page is at 150% brightness. | The widget is unaffected — controls stay readable. |
| Press a profile chip such as “Low stimulation”, then Reset visual adjustments in the detailed section. | Colours return to neutral; the profile chip changes to Custom. |
| Read “What visual adjustments cannot do”. | It states that filters do not change the website and cannot fix a site's contrast. |

### Screen reader

**3. Screen reader compatibility**

| Step | Expected |
|---|---|
| Open “Page check” at the top of the panel. | Counts for detected problems, warnings, notes and items needing a human decision. |
| Read the first findings. | Each names the element, quotes evidence from the page, links to a fix example and offers “Show me where”. |
| Press “Show me where”. | The element is scrolled into view and outlined for a few seconds; focus stays in the panel; the announcement names what was highlighted. |
| Press “Move focus there” on a finding whose element is focusable. | Focus moves to the page element. |
| Read the “What this audit cannot detect” list. | It names accuracy of alt text, contrast, custom widget behaviour, iframe/canvas/video content, reading order and anything needing a real screen reader. |
| Read the “About the toolbar itself” note. | It claims keyboard/AT support for the toolbar only, not for the page. |

**4. Image alternative text**

| Step | Expected |
|---|---|
| Open “Image alternative text”. | Counts of images found, with alt text, missing alt and `alt=""`. |
| Read the caveat above the counts. | It says a count of alt text is not a quality score. |
| Check the findings. | The card with no `alt` and the card using `card-design.svg` as alt are both listed; the correctly described image is not. |
| Read the two rendered examples. | One meaningful image with a description, one decorative image with `alt=""`, each with the markup beside it. |
| Look for a suggested description anywhere. | There is none — the panel states that the toolbar will not invent one. |

**5. Accessible form labels**

| Step | Expected |
|---|---|
| Submit the newsletter form empty. | The email field is reported as invalid with a corrective message; the placeholder-only “First name” field is reported by the page check as having no label. |
| Tab through the demo forms. | Each field announces its label, its hint and its error, because they are wired with `aria-describedby`. |
| Read “Form labels” in the panel. | Counts of controls, named controls, unnamed controls, orphan labels and groups needing a label, plus the components and the markup to use. |

**6. Accessible headings and landmarks**

| Step | Expected |
|---|---|
| Open “Headings and landmarks”. | A nested list of the page's headings with level badges; the demo's outline matches what you see. |
| Press an outline entry. | The page scrolls to that heading and outlines it. |
| Read the counts line. | One main landmark, one named navigation landmark, twelve headings (the exact numbers depend on the page). |
| Read “What good structure looks like”. | The skip-link + `main` + named `nav` markup, and the reminder that ARIA is only needed to name things HTML cannot. |

**7. Screen reader status announcements**

| Step | Expected |
|---|---|
| Subscribe to the newsletter with a valid address. | The visible status line appears and is announced once — the region itself announces, with no second call to the shared service. |
| Open “Screen reader status announcements”. | Verbosity radio group, navigation announcement toggle, highlight toggle, a preview button and a log. |
| Press “Preview an announcement” twice quickly. | Spoken once; the second entry in the log says “dropped: duplicate”. |
| Set verbosity to “Only errors and protective actions”, then move a slider. | The slider value is not announced; the verbosity confirmation itself was heard. |
| Navigate to an in-page anchor. | The new view is announced once. |
| Read the log while it is empty and after actions. | It is plain text with no live region: reading it does not trigger speech. |

### Forms and interaction

**8. Accessible error messages**

| Step | Expected |
|---|---|
| Submit the newsletter form with “abc”. | Focus moves to the form's error summary; the summary lists the problem as a link; the field has `aria-invalid="true"` and the message in its description. |
| Activate the summary link. | Focus moves to the email field without changing the URL. |
| Type a valid address and submit. | The message disappears from both the field and the summary. |
| Turn on “Also announce errors out loud” and repeat. | The summary is now also announced — deliberately twice, which is why it is off by default. |
| Read the numbers in the “Accessible error messages” section. | Fields marked invalid, invalid fields with no message, unassociated error blocks and fields the browser considers invalid. |

**9. Show / hide password**

| Step | Expected |
|---|---|
| In “Sign in”, type a password and press the Show button. | The text becomes readable; the button's label becomes Hide and it reports `aria-pressed="true"`; the announcement says “Password shown”. |
| Press Hide. | Back to dots; the value is unchanged. |
| Check the caret after toggling while typing. | Typing continues from where it was. |
| Read the button's accessible name. | “Show password for Password” — it never contains the value. |
| Turn off “Offer a show/hide control” in the panel. | The button disappears from the demo field on the next render; the field still works. |

**10. Accessible authentication**

| Step | Expected |
|---|---|
| Read the sign-in form. | Email has `autocomplete="username"`, the password field `current-password`; both announce their purpose; the hint says pasting is allowed. |
| Paste into the password field. | It works — nothing blocks paste. |
| Open “Accessible authentication”. | The table of autocomplete values for sign-in, registration, reset and one-time codes; recovery and multifactor guidance; and the statement that a toolbar cannot repair another site's login. |
| Read “What the toolbar stores”. | One storage key, settings only; no password, code, token or field value; the audit reads attributes, never values. |
| Run the audit findings for authentication. | The demo's credential fields are reported only if they lack autocomplete or block paste. |

**11. Confirmation before important actions**

| Step | Expected |
|---|---|
| Press “Delete account”. | A modal dialog opens, named “Delete this demo account?” with its description and the list of consequences; focus is on “Keep the account”. |
| Press Escape. | Cancels; focus returns to the button. |
| Open it again, press Tab twice. | Focus cycles between the two buttons and cannot leave the dialog. |
| Confirm. | The status message reports the deletion; focus returns to the invoking button. |
| Click the backdrop while it is open. | Cancels with focus returned. |
| Read the “When a confirmation is worth it” list. | Routine and reversible actions are explicitly listed as *not* worth confirming. |

### Personalization

**12. Save accessibility preferences**

| Step | Expected |
|---|---|
| Change a slider and reload. | The value is restored; the panel shows a “last saved” time. |
| Press “Save now”. | An explicit confirmation (or an explicit failure if storage is blocked). |
| Read “About saved preferences”. | It says preferences are per browser and per device, can be cleared, and can be disabled — in which case the toolbar says so instead of pretending. |
| Expand “Show the saved data”. | The exact JSON payload; no password, code, token, page content or allowlist in it. |
| Export, then import the file. | The announcement says how many settings were applied. |
| Edit the stored entry to `visual.brightness = 9999` and reload. | It comes back clamped to 150. |
| Replace the stored value with `{oops` and reload. | Defaults are used, with an announcement that saved settings could not be read. |
| Open a second tab and change something in one. | The other tab picks it up. |

**13. Reset accessibility settings**

| Step | Expected |
|---|---|
| Apply “Low stimulation”, then reset only “Visual adjustments”. | Colours return to normal; motion settings stay as the profile left them. |
| Reset “Everything”. | Every value returns to the documented defaults, filters are removed immediately, and saved profiles are still listed. |
| Press “Undo the reset” within 15 seconds. | The previous settings come back exactly. |
| Wait for the window to pass and look again. | The undo button is gone and the status says the window has passed. |
| Expand “The default configuration”. | The list matches the defaults documented in `defaultSettings.js`. |
| Cancel the confirmation dialog. | Nothing changes. |

**14. Accessibility profiles**

| Step | Expected |
|---|---|
| Press the “Enhanced contrast” chip. | Contrast goes to 130%; the announcement reports how many settings changed. |
| Move the brightness slider. | The chip row shows **Custom** with the explanation; the profile itself is still available. |
| Press “Reduced motion”. | Motion settings change; brightness and saturation are exactly as they were. |
| With the OS set to reduce motion, press “Default”. | The motion switch reads “Following your system setting: reduce motion is on” — the profile did not force it off. |
| Open the profiles section, save a named profile, reload. | The saved profile is still in the list and still selected. |
| Delete a saved profile and confirm. | It disappears; current settings are unchanged. |
| Set `profiles` in the config with a custom entry and reload. | The extra profile appears as a chip and applies its patch. |

---

## 4. Cross-cutting checks

* **Keyboard only.** Do a full pass with the mouse unplugged: launcher, panel, every control,
  the confirmation dialog, the password toggle, the form fields, the summary links, the outline
  jumps. Nothing should require a pointer, and every focus stop must be visible.
* **prefers-reduced-motion.** Set the OS preference and reload: motion is reduced, the widget's
  own transitions are neutralised, and “Default” never forces motion back on.
* **Forced colours.** Turn on Windows High Contrast (or emulate `forced-colors: active`): the
  launcher, panel, chips and dialog use system colours with visible borders and the flash
  highlight switches to `Highlight`.
* **400% zoom / 320px width.** No horizontal scrolling in the panel or the page; the panel
  becomes a bottom sheet.
* **Screen reader pass.** NVDA + Firefox or VoiceOver + Safari: the launcher name and state, the
  dialog name and description, the announcement log, the error summary focus move, the password
  toggle state, and the profile chips' pressed state.
* **Persistence and privacy.** `JSON.stringify(localStorage)` after typing a password: the value
  must not appear. Only one key, `assistaccess.a11y.settings`, should exist.

---

## 5. What these tests cannot show

The widget changes how a page is displayed and announced. It cannot make a third-party site
conform to WCAG, and passing every case above is not a conformance claim about any page. The audit
reports structural problems only; accuracy of a description, a label or a heading, colour contrast,
custom widget behaviour, media captions and content inside iframes all need a human — and the
panels say so in as many words.
