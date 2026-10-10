# Accessibility module — integration & manual test guide

> **See also:** [`INTEGRATION-READER.md`](./INTEGRATION-READER.md) — the screen reader phase
> (page audit, image alt text, form labels, headings/landmarks, status announcements): file list,
> developer fix examples, keyboard and screen-reader test cases.
>
> **See also:** [`INTEGRATION-FORMS.md`](./INTEGRATION-FORMS.md) — the forms phase (accessible error
> messages, show/hide password, accessible authentication, confirmation before important actions):
> components, privacy verification, boundary statement, keyboard and screen-reader test cases.
>
> **See also:** [`INTEGRATION-PREFERENCES.md`](./INTEGRATION-PREFERENCES.md) — the final phase (saved
> preferences, reset with undo, accessibility profiles): the documented default configuration, the
> settings API for other components, and the executable self-test
> (`node src/accessibility/integration/selfTest/settingsSelfTest.mjs`).

This covers the implemented slice of the accessibility toolbar:

| # | Feature | Status |
|---|---|---|
| 1 | Flashing content protection | Implemented (best-effort guard + motion controls + authoring pattern) |
| 2 | Brightness / colour intensity adjustment | Implemented (brightness, contrast, saturation, presets, reset) |
| — | Shared settings API (storage, migrations, announcements, hooks) | Implemented as the foundation both features use |

Nothing in this module claims that a toolbar can make an arbitrary website WCAG compliant, and
nothing in it claims to guarantee protection against photosensitive seizures. The limitation notices
are part of the product copy (`strings.js` → `limits`), not documentation-only fine print.

---

## 1. Files

```
src/accessibility/
  index.js                                  public entry point (import this)
  AccessibilityModule.jsx                   launcher + panel + provider
  config.js  constants.js  strings.js        configuration, namespaced constants, all copy

  core/
    settingsSchema.js                       shape, ranges, defaults, clamping, migrations
    settingsReducer.js                      pure reducer
    SettingsContext.jsx                     shared settings API (hooks, persistence, appliers)
    storage.js                              local → session → memory probe + cross-tab sync
    color.js                                colour parsing, relative luminance, contrast
    a11y/announcer.js                       the two live regions + announce()
    a11y/reducedMotion.js                   prefers-reduced-motion helpers/hook
    a11y/mediaQueries.js                    forced-colors / prefers-contrast / generic hook
    apply/applyVisual.js                    brightness/contrast/saturation applier
    apply/applyMotion.js                    reduced-motion, pause, autoplay-media applier
    apply/forcedStyles.js                   the only !important allowlist, with justifications
    dom/domScope.js                         content-root resolution, visibility, element keys
    dom/domPatches.js                       the only writer of styles/attributes outside React
    dom/domRegistry.js                      one MutationObserver for the whole module
    flash/animationInventory.js             Web Animations inventory + luminance estimate
    flash/flashEstimator.js                 flash-rate/area/red-flash risk bands
    flash/mediaInventory.js                 video/GIF/marquee/SVG stop controls, canvas/embed list
    flash/flashGuard.js                     scan → estimate → pause/hide → report engine

  features/
    registry.js                             feature descriptors (id, WCAG refs, capability, Panel)
    flashing/FlashingPanel.jsx              feature 1 panel
    flashing/FlashGuardControls.jsx         guard controls + findings list
    flashing/useFlashGuard.js               React binding for the guard
    motion/MotionControls.jsx               reduced-motion toggle, strategy, pause, media
    visuals/VisualsPanel.jsx                feature 2 panel
    visuals/presets.js                      preset definitions and matching

  patterns/
    SafeAnimatedContent.jsx                 safe pattern for app-owned animation
    safeMotion.js                           thresholds + development warning

  ui/                                       the toolbar's own primitives (shadow-scoped)
    PanelHost.jsx  Panel.jsx  ToolbarLauncher.jsx
    Switch.jsx  SliderControl.jsx  Disclosure.jsx  VisuallyHidden.jsx
    styles/  tokens.js primitives.js panel.js highContrast.js reducedMotion.js index.js

  integration/
    events.js                               window CustomEvent bridge
    mount.jsx                               imperative mount for non-React pages
    devHarness/                             hostile host app used for manual testing
```

---

## 2. Integrating into the team project

### 2.1 Recommended: wrap the application

```jsx
// src/App.jsx (or main.jsx)
import AccessibilityModule from './accessibility';

export default function App() {
  return (
    <AccessibilityModule config={{ position: { corner: 'bottom-right' } }}>
      <YourExistingApp />
    </AccessibilityModule>
  );
}
```

Why wrapping: the settings provider then sits above the app, so teammates can use the hooks
(§3), and the toolbar's shadow host is appended to `<body>` as a **sibling** of your app root —
React never renders into it and never deletes it.

### 2.2 Your toolbar owns the chrome

```jsx
import { AccessibilityProvider, a11yFeatures, ToolbarLauncher } from './accessibility';
import Panel from './accessibility/ui/Panel.jsx'; // or your own panel chrome

<AccessibilityProvider config={...}>
  <YourApp />
  {/* render your own button and the feature panels from the registry */}
</AccessibilityProvider>
```

`a11yFeatures` gives you `{ id, title, group, capability, wcag, summary, Panel }` per feature, so your
toolbar can list and render them without importing anything internal.

### 2.3 No React

```js
import { mountAccessibilityToolbar } from './accessibility/integration/mount.jsx';

const toolbar = mountAccessibilityToolbar({ storage: 'local' });
toolbar.open();     // programmatic
toolbar.close();
toolbar.unmount();  // removes every injected style, attribute and paused animation
```

### 2.4 Configuration reference (all optional)

| Key | Default | Notes |
|---|---|---|
| `contentRoot` | `null` | Selector for "the website content" (used by content-scoped mode) |
| `mountTarget` | `document.body` | Where the shadow host is appended |
| `storageKeyPrefix` | `assistaccess.a11y` | Persisted key namespace |
| `storage` | `'auto'` | `auto` → local → session → memory, with a visible notice when degraded |
| `visualTarget` | `'auto'` | `'auto'` lets the user choose; pin to `'document'` or `'contentRoot'` to lock it |
| `position` | `bottom-right`, 16/16 | Corner and offsets |
| `theme` | `null` | `{ '--a11ytb-accent': '#005ea8', ... }` token overrides |
| `strings` | `null` | Partial copy overrides merged over `strings.js` |
| `announce` | `true` | Set `false` if the host app owns announcements |
| `onSettingsChange` | `null` | `(settings, meta) => void` |
| `onFinding` | `null` | Called per flash-guard result batch |
| `features.disabled` | `[]` | Hide features, e.g. `['visuals']` |
| `debug` | `false` | Warn about unknown config keys |

### 2.5 Events (for non-React code)

`a11ytb:ready`, `a11ytb:settings-changed`, `a11ytb:panel-opened`, `a11ytb:panel-closed`,
`a11ytb:announce-request`, `a11ytb:finding`, `a11ytb:panel-open-request`,
`a11ytb:panel-close-request`.

```js
import { subscribeToA11yEvents, EVENTS } from './accessibility';
const off = subscribeToA11yEvents(EVENTS.SETTINGS_CHANGED, ({ settings }) => { /* ... */ });
```

---

## 3. Shared settings API (what teammates may rely on)

```js
import { useA11ySettings, useA11ySetting, useEffectiveReducedMotion, useAnnounce } from './accessibility';

const { settings, actions, meta, config, strings } = useA11ySettings();
// settings.visual   { enabled, brightness, contrast, saturation, target }
// settings.motion   { reduceMotion, pauseAnimations, motionStrategy, pauseAutoMedia, flashGuard }
// meta              { hydrated, storageMode, storageDegraded, osReducedMotion, effectiveReducedMotion }

actions.setVisualValues({ brightness: 120 });   // clamped, persisted, announced
actions.setMotion('reduceMotion', 'on');
actions.announce('Saved');                       // respects the user's announcement setting
```

Persistence: one key, `assistaccess.a11y.settings`, written 300 ms after the last change, synced across
tabs. The payload is versioned (`schemaVersion`) and every value is re-clamped on load, so a
hand-edited entry cannot produce an out-of-range filter.

Stability rules for the parts teammates touch:

* Unknown top-level settings groups are preserved verbatim, so a later phase can add `reader` or
  `forms` groups without an older version of this file dropping them.
* Adding a key or a group is a minor change; renaming or removing one requires a migration.
* `useEffectiveReducedMotion()` works with or without the provider, so components can be reused
  outside the toolbar.

---

## 4. Integration contract (what the module promises the team)

1. **No global CSS.** The toolbar's own styles live inside a shadow root. Nothing is imported into
   the page's stylesheet, and there is no element, `body`, `html` or `*` selector anywhere in the
   module's own styles.
2. **Namespaced page writes.** Page-level changes are limited to: an inline `filter` on the chosen
   root (composed with, and restoring, whatever inline filter was already there), one `<style>` tag
   per concern with an `a11ytb-*` id, `data-a11ytb-*` attributes, two live regions, and the shadow
   host element. Nothing is moved, cloned or deleted from your app.
3. **React-safe.** The shadow host is a sibling of the app root, so reconciliation cannot delete it
   and it cannot delete your nodes. Page nodes never receive children from the toolbar.
4. **Reversible.** Every applier returns a cleanup path; unmounting removes the style tags, the
   overlay host, the live regions, the observer, the timers and every attribute it added, and
   resumes every animation and media element it paused.
5. **`!important` is auditable.** It exists in exactly one file
   (`core/apply/forcedStyles.js`) with a written justification per stylesheet, scoped to
   `data-a11ytb-*` markers, and is user-initiated and removable.
6. **No network, no analytics, no credentials.** Settings contain no page content. Video/audio is
   paused, never read.

---

## 5. Manual test plan

### 5.1 Run the dev harness

The harness is a normal Vite project folder; it needs a bundler because it uses JSX.

```bash
# from the repository root, one time
npm create vite@latest a11y-harness -- --template react
# copy the module in
#   src/accessibility  →  a11y-harness/src/accessibility
# then replace a11y-harness/src/App.jsx with:
#   export default function App(){ return null; }   (the harness renders itself)
# and point a11y-harness/index.html at src/accessibility/integration/devHarness/main.jsx
cd a11y-harness && npm install && npm run dev
```

Simplest alternative: copy `integration/devHarness/` into any existing React app you already run, and
render `<AccessibilityModule><HostApp /></AccessibilityModule>` in one of its routes. The harness needs
`react` and `react-dom` only.

Optional fixtures: put any `sample.mp4` and `flash.gif` next to the harness `index.html` to test real
media.

### 5.2 Feature 1 — flashing content protection

| # | Step | Expected result |
|---|---|---|
| 1 | Load the harness. | The “Flashing block (150 ms cycle)” region stops flashing within ~2 s of load; the toolbar announces how many items were paused. |
| 2 | Open the toolbar, expand “Flashing content protection”. | The findings list shows the fast flash and the opacity blink with band labels (“Above the threshold”, “Possibly above the threshold”), the estimated flashes/second, the estimated area share and a confidence note. |
| 3 | Look at the 800 ms slow pulse and the spinner. | Neither is listed: 1.3 flashes/second is below the threshold, and a rotation has no luminance change. This is the check that the estimator is not just “any infinite animation”. |
| 4 | Find the “Excluded zone” section. | Its flashing block keeps flashing — `data-a11ytb-exclude` subtrees are skipped. |
| 5 | Change “When flashing is suspected” to “Hide it”. | The block disappears (still occupying its layout box), the finding shows “Hidden”, and the announcement reports the change. |
| 6 | Press “Restore everything this toolbar changed”. | Both blocks animate again and no finding shows “Paused”. |
| 7 | Press “Allow” on a finding, then “Stop allowing”. | The element is left alone (and stays paused/visible as you set it); “Stop allowing” makes the guard act on it again on the next scan. |
| 8 | Turn “Watch for flashing content” off. | All changes are reverted, the guard stylesheet is removed, and the findings list disappears. |
| 9 | Expand the canvas/embed list. | The canvas animation (5 flashes/second!) and any iframe are listed as “cannot be inspected” — the honest limitation. |
| 10 | Switch “Pause all animations and transitions now” on. | The slow pulse, the spinner and the marquee stop; the toolbar's own controls still respond instantly. |
| 11 | Click into the page and Tab through the whole toolbar. | Every control is reachable, the focus ring is always visible (3 px, offset), and Tab can leave the panel back into the page (no focus trap). |
| 12 | Press Esc inside the panel. | The panel closes and focus returns to the “Accessibility options” launcher. |
| 13 | Set your OS to “reduce motion” (or emulate it in DevTools → Rendering → Emulate prefers-reduced-motion). | On load, “Reduce motion” reads as on and shows “Following your system setting”; the toolbar announces it. Toggle it off: the toolbar now says it will not follow the system setting, and announces that. |
| 14 | Reload the page. | Your choices are restored (check `localStorage['assistaccess.a11y.settings']`), and the panel footer reports the storage mode. |
| 15 | Open the same page in a second tab and change a setting. | The first tab picks the change up (cross-tab sync). |
| 16 | In DevTools, block `localStorage` (or use a private window) and reload. | The toolbar reports that settings cannot be saved and keeps working in memory instead of failing silently. |

### 5.3 Feature 2 — brightness / colour intensity

| # | Step | Expected result |
|---|---|---|
| 1 | Expand “Brightness and colour”. | Master switch, seven presets, three sliders (brightness 50–150, contrast 50–150, saturation 0–200), a scope selector, a reset button and the limitation notice are present. |
| 2 | Move the brightness slider with the arrow keys. | The page brightens immediately; the slider announces “Brightness 125 percent” (debounced, not on every key repeat). |
| 3 | Press Home / End on the slider. | Values clamp to 50 and 150 — the slider cannot be pushed into an unreadable range. |
| 4 | **Look at the toolbar itself.** | The toolbar keeps its own colours: the applier counter-filters the host with the exact inverse of the applied filters, so the panel is as readable at 150% brightness as at 100%. |
| 5 | Choose “Grayscale” (saturation 0). | The page loses colour. The toolbar also appears grey — documented and unavoidable — but text, borders and the focus ring stay fully readable. |
| 6 | Watch the purple fixed banner at the bottom and the sticky header while filters are applied. | Both keep working in the default “Whole page” mode: a filter on the document root does not create a containing block for fixed descendants. |
| 7 | Switch “Apply to” to “Content area only”. | The fixed banner loses its positioning — the documented trade-off, which is why this mode is opt-in and warned about in the panel. Switch back. |
| 8 | Press the teammate toolbar button (“Set teammate inline filter on `<html>`”). | The page does not change: the module composes its filter with the inline filter instead of overwriting it. Press again to remove it and confirm the teammate's value is restored exactly. |
| 9 | Pick a preset (e.g. “Higher contrast”). | Values change together, the preset radio becomes selected, and the announcement names the preset. |
| 10 | Move one slider after choosing a preset. | The radio group reports “Custom values” — the preset is no longer claimed to be in effect. |
| 11 | Press “Reset visual adjustments”. | Filters are removed from the page, the sliders return to 100, the switch goes off, and the announcement confirms it. |
| 12 | Turn the master switch off without resetting. | Filters are removed from the page but your slider values are kept — switching it back on restores exactly the same look. |
| 13 | Enable Windows High Contrast Mode (or emulate `forced-colors: active`). | The panel shows the caution about filters fighting the colour scheme, and the toolbar's chrome uses system colours with visible borders. |
| 14 | Zoom to 400% (or set the viewport to 320 px). | The panel uses the available width, scrolls vertically, and never requires horizontal scrolling. |
| 15 | Apply a user stylesheet with the WCAG 1.4.12 text-spacing overrides. | Panel text reflows; no labels or values are clipped. |

### 5.4 Authoring-side pattern (the part a toolbar cannot do)

The fixtures include a correct implementation. In your own app:

```jsx
import { SafeAnimatedContent, checkAnimationSafety } from './accessibility';

// Dev-time check: warns in the console when a planned animation is above the thresholds.
checkAnimationSafety({ flashesPerSecond: 6, areaPx: 400000, redFlash: false });

<SafeAnimatedContent
  caption="Promotional banner"
  flashesPerSecond={1}          // checked in development
  areaPx={960 * 200}
  defaultState="paused"          // potentially flashing content must not autoplay
>
  <div className="promo-banner" />
</SafeAnimatedContent>
```

Rules the pattern encodes, and the reason each one exists:

1. **Do not autoplay content that may flash.** Start paused and require a deliberate start. This is the
   only reliable protection, because it happens before the content is rendered.
2. **Keep the flash rate at or below three per second** (`SAFE_MOTION.MAX_FLASHES_PER_SECOND`), which
   means a cycle of at least ~334 ms, and keep the flashing area small (below ~21,824 CSS px or 25% of
   the viewport).
3. **Treat saturated red flashes as stricter** — they are hazardous at smaller areas.
4. **Provide pause, stop and hide** for anything that moves for more than five seconds (WCAG 2.2.2),
   in a labelled control group, keyboard operable, with visible focus. The pattern provides all three;
   “stop” also resets the animation to its first frame.
5. **Honour reduced motion** (OS or toolbar setting) by not starting, while still allowing an explicit
   user start.
6. **Mark correctly handled subtrees with `data-a11ytb-exclude`** so the toolbar's scanners leave them
   alone instead of second-guessing them.

---

## 6. Known limitations (deliberate, not oversights)

* **Flashing inside video, animated images, canvas, plugins and cross-origin iframes cannot be detected
  or reliably stopped.** Their pixels are not readable from the page. The toolbar lists them as
  unverifiable, offers pause where the platform allows it (media) and hide elsewhere, and says so in
  the panel. A CSS/JS toolbar toggle is not protection against photosensitive seizures.
* **Detection is an estimate.** Flash rate is derived from animation timing and the luminance swing from
  keyframe colour values; opacity-only animations are flagged as low confidence because the backdrop is
  unknown. Scripts that re-trigger short one-shot animations repeatedly can stay under the thresholds.
* **“Pause everything” can hide content.** Reveal-on-scroll animations that are paused at frame zero can
  leave content invisible, which is why “finish them immediately” is the default strategy for reduced
  motion. The panel states this next to the control.
* **Filters change perception, not the site.** They cannot repair colour-only information, images of
  text, or a site that fails contrast requirements. In grayscale mode the toolbar itself is also
  desaturated (colour information is already gone by the time our counter-filter applies).
* **Content-area filter mode can break fixed positioning** inside that subtree. It is opt-in and the
  panel warns about it.
* **Media resumption is not automatic.** Turning off “pause autoplaying media” stops the toolbar from
  holding playback; it does not call `play()`.
* **Shadow DOM and page ARIA.** The toolbar's own labels live inside the shadow root; page-facing ARIA
  references never do, because IDREF attributes do not cross shadow boundaries.

## 7. Not implemented yet (later phases)

Accessible error messages, accessible authentication, confirmation dialogs, show/hide password,
alt text, form labels, headings/landmarks, profile management and reset-with-undo belong to later
phases. The settings schema, announcer, event bridge and UI primitives they build on are already in
place, so each of them becomes an additive change (new settings group + panel + registry entry).

## 8. Verification performed on this slice

* `node --check` on all 32 plain-JS modules: clean.
* Static check of all 50 `.js`/`.jsx` files: every relative import resolves, no `.css` import outside
  the dev harness (no stylesheet can leak into the app), brace/paren balance and JSX tag structure
  clean.
* Manual verification steps above are the acceptance criteria; browser testing must be run in a real
  browser, since the guard depends on `document.getAnimations()`, real layout metrics and real media
  elements, none of which exist in jsdom.
