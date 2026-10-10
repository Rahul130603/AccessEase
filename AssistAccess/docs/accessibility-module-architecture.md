# AssistAccess — Accessibility Module Architecture & Implementation Plan

**Owner:** Feature owner for 14 accessibility features (motion/sensory, screen reader, forms/interaction, personalization)
**Stack:** React 18+ (function components + hooks), JavaScript + JSX, plain CSS
**Target:** WCAG 2.2 Level AA where achievable, WAI-ARIA Authoring Practices (APG) patterns for all custom UI
**Status:** Proposal — awaiting approval before any implementation code is written

---

## 0. Honest framing (read this first)

A toolbar is an **assistive overlay**, not a conformance fix. It cannot make arbitrary websites WCAG compliant, and this module will never claim that — not in code comments, not in UI copy, not in the final report.

- **Toolbar-owned features** work entirely inside our own UI + a runtime layer we control: motion control, visual adjustment, preference storage, profiles, confirmation dialogs, announcements.
- **Toolbar-assisted features** can *improve* an existing page at runtime by adding ARIA attributes, labels, or association links. These are heuristics: they can be wrong, they can be defeated by the page's own JS, and they are reversible by design.
- **Page-required features** (real alt-text authorship, server-side error messages, accessible auth flows, source-order semantics, captions, third-party widget keyboard support) cannot be delivered by any toolbar. For those, this module delivers (a) an audit that tells the site owner what to fix, (b) a user-side mitigation, and (c) a public API teammates can use to build it correctly in the first place.

Automated detection also cannot *judge* quality: we can detect a missing `alt`, never whether an `alt` is accurate.

---

## 1. Assumptions and decisions

| # | Assumption / decision | Rationale |
|---|---|---|
| A1 | `D:\AssistAccess` is currently empty; the team project structure does not exist yet | Verified. The module is therefore designed as a **drop-in folder + optional package** rather than assuming a path |
| A2 | The module ships **zero runtime dependencies** | Teammates may use any bundler/router/state library; plain React + browser APIs avoids version conflicts |
| A3 | Toolbar chrome renders inside a **Shadow DOM host appended to `document.body`**, as a sibling of `#root` | This is the single most important anti-conflict decision: no CSS leakage in either direction, and React never reconciles our nodes |
| A4 | Page-level visual effects are applied through **data attributes + CSS custom properties on one designated root**, driving **one** stylesheet we own | Only one writer per global side effect (see §3) |
| A5 | Settings live in `localStorage` under a namespaced, versioned key, with session/memory fallbacks | Private-mode Safari and quota errors must degrade visibly, never silently |
| A6 | `prefers-reduced-motion` is the **default** motion source; the user can override it explicitly | OS setting must win by default (and the override is announced, not silent) |
| A7 | Destructive runtime DOM edits are **opt-in and confirm-before-apply**; audit-only is the default for semantics features | A wrong `aria-label` injection is worse than a reported finding |
| A8 | Everything is reversible: every applier returns a `cleanup()`; originals are kept in a `WeakMap`, never in the DOM | Teammates can hot-swap/unmount the module without residue |

**Open questions for you** (defaults chosen, all changeable):
1. Is there an existing launcher/panel UI pattern in the team toolbar I must match visually? (Default: self-contained panel with overridable CSS custom-property tokens.)
2. Should teammates be able to import my hooks (`useA11ySettings`, `useConfirm`, `useAnnounce`) directly, or keep my module fully sealed behind one component? (Default: both — sealed component for mounting, small hook surface for sharing.)
3. Is a non-React mount (`mountAccessibilityToolbar()` on a plain HTML page) needed? (Default: yes, thin wrapper — it costs ~40 lines and saves rework.)

---

## 2. What a toolbar can and cannot do (feature capability matrix)

`Capability` legend: **T** = toolbar-owned, **A** = toolbar-assisted runtime patch, **P** = requires page/source change to be truly compliant.

| # | Feature | T | A | P | Toolbar-side reality | Page-side requirement |
|---|---|---|---|---|---|---|
| 1 | Flashing content protection | ✅ | ✅ | — | Detect animated/flashing regions via Web Animations API + heuristics; pause / freeze / hide / dim; blocklist + allowlist; persistent setting | Authors must keep content under 3 flashes/sec (2.3.1) and provide pause controls (2.2.2) — detection is heuristic, not a certification |
| 2 | Brightness / color intensity | ✅ | ✅ | — | CSS filters / dim overlay on a designated root, presets, live sliders, per-site override, instant undo | Real contrast ratios (1.4.3, 1.4.11) are set by the author's colors; our filter can improve *or* worsen perceivability. Filters also cannot fix information conveyed by colour alone (1.4.1) |
| 3 | Screen reader compatibility | ✅ | ✅ | ✅ | Own UI fully APG/SR compliant; audit engine that finds missing names, broken label associations, invalid roles, focusable `aria-hidden` subtrees, positive `tabindex`, untitled iframes; "jump to element" + suggested fix | Correct name/role/value (4.1.2) and info/relationships (1.3.1) must exist in the source; AT reads the DOM we patch, and third-party JS can overwrite our patches |
| 4 | Image alternative text | — | ✅ | ✅ | Scan images for missing/placeholder/duplicated `alt`, `alt` on decorative images, images-of-text suspicion; user can supply a personal note, mark decorative (opt-in patch), or list as a task | Only content owners can write *meaningful* alt (1.1.1); a toolbar cannot invent meaning |
| 5 | Accessible form labels | — | ✅ | ✅ | Audit for label/name gaps; suggest from `<label for>`, wrapping label, `aria-label`, visible text, `placeholder`, `title`, nearest heading — ranked, confidence-scored, user-confirmed; patch adds `aria-label`/`aria-labelledby` | Durable labels and instructions belong in the source (1.3.1, 3.3.2); a placeholder is not a label; our patch is a stopgap |
| 6 | Headings and landmarks | ✅ | ✅ | ✅ | Heading-outline navigator (jump list, level skips flagged — 2.4.6/2.4.10 guidance), landmark detection + optional role injection to enable landmark navigation and Bypass Blocks | Real heading hierarchy and landmarks must be authored (1.3.1, 2.4.1); injected roles can conflict with the page's own roles |
| 7 | Status announcements | ✅ | ✅ | — | One polite + one assertive live region owned by the module; announces settings changes, audit results, fixes applied, profile switches, route/title changes (4.1.3); public `announce()` for teammates | The *site's* dynamic status messages need the site's own live regions; we only announce what we can observe |
| 8 | Accessible error messages | ✅ | ✅ | ✅ | For teammate forms: `<FormField>`, `<ErrorSummary>`, `useFormErrors()` that wire `aria-invalid`/`aria-describedby`/focus-move correctly. For arbitrary forms: heuristic error-text detection, association, non-colour-only prefix, announcement | Server-side validation messages, correct association, and error suggestions (3.3.1, 3.3.3) must come from the app; we cannot parse intent reliably |
| 9 | Show / hide password | — | ✅ | — | Inject an accessible toggle into password fields (per-field name, `aria-pressed`, live state announcement, caret + value preserved, password managers untouched), caps-lock hint, optional "reveal last character" | Site should offer the toggle itself; we must never log, store, or transmit values |
| 10 | Accessible authentication | — | ✅ | ✅ | Add `autocomplete` hints (`username`, `current-password`, `new-password`, `one-time-code` — 1.3.5), strip paste/copy blockers and `autocomplete="off"` on auth fields (3.3.8), session-scoped non-sensitive "redundant entry" recall (3.3.7), warn on cognitive-test detection | 3.3.8 compliance requires the site to allow password managers, paste, and non-cognitive login — the toolbar can mitigate, not certify |
| 11 | Confirmation before important actions | ✅ | ✅ | ✅ | `useConfirm()` + `<ConfirmButton>` + `<ReviewAndConfirm>` for teammate UI (built on `<dialog>`, focus trap, Esc, focus restore, 3.3.4); optional page guard for destructive-looking submits and unsaved-change navigation | Server-side irreversible actions need the site's own review/undo step (3.3.4); we can only intercept what happens in the browser |
| 12 | Save accessibility preferences | ✅ | — | — | Versioned schema + migrations, debounced autosave, cross-tab sync, opt-in per-site overrides, JSON export/import, "what is stored"/"delete my data" transparency | — |
| 13 | Reset accessibility settings | ✅ | — | — | Full reset + per-group reset, confirm-first (uses #11), one-step undo, live re-apply without reload | — |
| 14 | Accessibility profiles | ✅ | — | — | Presets (low vision, motion-sensitive, reading/dyslexia-friendly, screen-reader/keyboard, high-glare) + user-defined profiles; switching announces and is reversible | Profiles are convenience presets, **not** diagnostic or clinically validated; every control stays user-adjustable |

---

## 3. Design principles (binding rules)

1. **One writer per global side effect.** Exactly one module writes `document.documentElement.style`, exactly one `MutationObserver` exists, exactly one polite and one assertive live region, exactly one injected `<style>` per concern. This is what prevents four teammates' modules from fighting.
2. **Namespace everything.** Attributes `data-a11ytb-*`, custom properties `--a11ytb-*`, classes `a11ytb-*`, storage keys `assistaccess.a11y.*`, events `a11ytb:*`, style tag ids `a11ytb-*`.
3. **Never mutate what we did not create.** No removing/overwriting existing classes, attributes, inline styles, or children. Page nodes get *added* namespaced attributes only; originals live in `WeakMap`s.
4. **Never inject nodes into React-managed containers.** React will delete nodes it does not own during reconciliation. Our host is a sibling of `#root`; injected helper nodes (e.g. description targets) live in our own container or are avoided in favour of attribute-only patches.
5. **Shadow DOM for our chrome only.** IDREF attributes (`aria-labelledby`, `aria-describedby`) do not resolve across shadow boundaries — so page-related ARIA must reference light-DOM ids. Consequence: the toolbar's own labels live inside the shadow root; anything that must describe a *page* element is injected in the light DOM.
6. **Reversible by construction.** Every `apply()` returns `cleanup()`; unmount restores the page byte-for-byte at the attribute/style level. Teardown is a test suite, not a hope.
7. **Zero global CSS.** No element/`*`/`body` selectors. Page-affecting rules are scoped under `html[data-a11ytb-visuals]` (or the configured content root) and use `:where()` for 0 specificity; a tiny, auditable `!important` allowlist exists in one file with a justification comment per rule.
8. **Low specificity, high opt-in.** Teammates opt into text/motion cooperation via tokens (`--a11ytb-motion-scale`) and a class hook (`a11ytb-reduce-motion`) instead of us overriding their CSS.
9. **Audit → suggest → confirm → apply → announce → undo.** No silent page rewriting, ever.
10. **The toolbar must pass its own audit.** Our UI is subject to the same keyboard, focus, contrast, target-size, reflow, and reduced-motion rules we apply to the page.

### 3.1 Security / privacy red lines
No network calls, no analytics, no telemetry. No storage of credentials or field values (only non-sensitive redundant-entry values, session-scoped, opt-in, with a visible "clear" action). `autocomplete` attribute edits never read or write values. Exported settings contain no page content.

---

## 4. Folder structure

```
src/
  accessibility/                        # ← the whole deliverable; deletable in one step
    index.js                            # PUBLIC ENTRY POINT (see §7) — the only import teammates need
    AccessibilityModule.jsx             # top-level component: provider + host + launcher + panel host
    config.js                           # config defaults + normalization + validation warnings
    constants.js                        # FEATURE_IDS, STORAGE_KEYS, EVENTS, CSS_PREFIX, API_VERSION
    strings.js                          # all user-facing + announced copy, overridable by config.locale

    core/
      settingsSchema.js                 # canonical shape, version, defaults, validators
      migrations.js                     # v1→v2→v3 pure migration functions
      settingsReducer.js                # pure reducer + action creators (no DOM, no storage)
      SettingsContext.js                # context + useSettings/useSetting/useSettingsActions
      storage/
        index.js                        # adapter selection + safe try/catch + capability probe
        localStorageAdapter.js
        sessionStorageAdapter.js
        memoryAdapter.js
        siteOverrides.js                # per-origin overrides (opt-in, privacy-noted)
      apply/
        applyVisual.js                  # filters/overlay/custom properties → single style writer
        applyMotion.js                  # reduced-motion + pause/freeze stylesheet + WAAPI control
        applyTypography.js              # OPTIONAL extension (text scale/spacing) — not one of the 14
        forcedStyles.js                 # the only file allowed `!important`, each with a justification
      dom/
        domScope.js                     # content-root resolution (config → main → role=main → #root → body)
        domRegistry.js                  # single MutationObserver + debounced subscriber fan-out
        attributeRegistry.js            # namespaced add/restore via WeakMap
        idGen.js                        # collision-free ids for injected ARIA references
        snippets.js                     # small DOM helpers (closestField, isVisible, labelLookup)
      a11y/
        announcer.js                    # polite/assertive regions, queue, dedupe, rate limit
        focusUtils.js                   # focus trap, restore, roving tabindex, skip link
        focusDodge.js                   # keeps toolbar from obscuring the focused element (2.4.11)
        contrast.js                     # relative luminance / contrast ratio / APCA-lite helpers
        color.js                        # hex/rgb/hsl parse + serialize
      audit/
        auditEngine.js                  # orchestrates checks, dedupes findings, throttles
        findings.js                     # finding model + severity + WCAG ref + fix id
        checks/                         # one file per check, pure-ish, returns findings
          checkImageAlt.js
          checkFormLabels.js
          checkHeadingOrder.js
          checkLandmarks.js
          checkInteractiveNames.js
          checkAriaIntegrity.js         # invalid role/attr, focusable aria-hidden, positive tabindex
          checkFormErrors.js
          checkAuthFields.js
      confirm/
        confirmService.js               # promise-based queue + single dialog host
        useConfirm.js
      flash/
        animationInventory.js           # document.getAnimations() + keyframe/timing analysis
        flashEstimator.js               # flashes/sec + luminance delta + area estimate
        mediaInventory.js               # <video autoplay>/<marquee>/<blink>/GIF heuristics
        videoSampler.js                 # optional same-origin video frame luminance sampling
      forms/
        errorAssociator.js              # heuristic error text → field association + patch
        passwordToggle.js               # inject toggle into password fields
        authAssist.js                   # autocomplete hints, paste-block removal, redundant entry
        actionGuard.js                  # destructive-submit / unsaved-change interception
      profiles/
        profilePresets.js               # built-in profile definitions (partial settings patches)
        profileStore.js                 # user-defined profile CRUD + validation
      features/
        registry.js                     # feature descriptors (id, title, group, wcag, capability, Panel)
        useFeature.js                   # enable/disable lifecycle for a runtime applier
        flashing/                       # Panel + controls for #1
        visuals/                        # Panel + controls for #2
        screenReader/                   # Panel + audit report UI for #3
        altText/                        # Panel + per-image editor for #4
        formLabels/                     # Panel + suggestion review UI for #5
        headings/                       # Outline navigator panel for #6
        announcements/                  # Verbosity + preview panel for #7
        errors/                         # Panel + teammate-facing components for #8
        password/                       # Panel + PasswordToggleButton for #9
        auth/                           # Panel + privacy notice for #10
        confirm/                        # Panel + ConfirmDialog for #11
        preferences/                    # Save/export/import/data panel for #12
        reset/                          # Reset + undo panel for #13
        profiles/                       # Profile selector/editor panel for #14

    ui/                                 # our chrome primitives (all APG-compliant)
      PanelHost.jsx                     # portal + top-layer/shadow mount, Esc, focus restore
      Panel.jsx                         # disclosure-based sections, heading structure, scroll
      ToolbarLauncher.jsx               # button with aria-expanded/aria-controls
      IconButton.jsx
      Switch.jsx                        # role="switch" + visible on/off text
      SliderControl.jsx                 # native range + numeric input pair + aria-valuetext
      RadioGroup.jsx                    # native radios in fieldset/legend
      SelectControl.jsx                 # native <select> (no custom listbox)
      CheckboxControl.jsx
      Disclosure.jsx                    # aria-expanded / aria-controls
      ConfirmDialog.jsx                 # <dialog>-based, focus trap, Esc
      Toast.jsx                         # optional; paired with announcements
      VisuallyHidden.jsx
      LiveRegions.jsx                   # the two regions (mounted once, empty at rest)
      ErrorSummary.jsx                  # for teammates (#8)
      FormField.jsx                     # label + hint + error + required wiring (#8)
      styles/
        tokens.css                      # --a11ytb-* design tokens (overridable)
        primitives.css
        panel.css
        highContrast.css                # @media (forced-colors: active) + prefers-contrast
        reducedMotion.css               # toolbar's own motion
        index.js                        # returns the CSS text for shadow-root adoption

    integration/
      mount.js                          # mountAccessibilityToolbar() for non-React hosts
      events.js                         # window CustomEvent bridge (a11ytb:*)
      devHarness/                       # standalone page: hostile host fixture (§11)
        index.html
        hostApp.jsx
        hostStyles.css                  # intentionally aggressive styles to prove isolation
```

**Conventions:** one component per file, named export + default export for panels; `use*` hooks never render DOM except via refs they own; every file that touches the page imports from `core/dom/*` (never `querySelectorAll` inline); JSDoc types on all public functions; `eslint-plugin-jsx-a11y` in the shared ESLint config.

---

## 5. Core architecture

### 5.1 Layer diagram

```
                     ┌──────────────────────────────────────────────┐
  host app /         │  AccessibilityModule  (single entry point)    │
  teammate toolbar   │   config → provider → launcher → panel host   │
                     └───────────────┬──────────────────────────────┘
                                     │
        ┌────────────────────────────┼─────────────────────────────┐
        │                            │                             │
 ┌──────▼──────┐            ┌────────▼────────┐          ┌─────────▼─────────┐
 │ STATE LAYER │            │  APPLY LAYER    │          │  DOM PATCH LAYER  │
 │ reducer +   │  settings  │ visual / motion │  patch   │ audit engine →    │
 │ context +   │───────────▶│ custom props +  │─────────▶│ confirmed fixers  │
 │ storage +   │            │ 1 style tag     │          │ (attributes only) │
 │ migrations  │            └────────┬────────┘          └─────────┬─────────┘
 └──────┬──────┘                     │                             │
        │ announcements              │ cleanup()                   │ findings
        └──────────────┬─────────────┴──────────────┬──────────────┘
                       ▼                            ▼
              ┌─────────────────┐          ┌──────────────────┐
              │ ANNOUNCER (2    │          │  UI (shadow DOM) │
              │ live regions)   │◀─────────│  panel + primitives │
              └─────────────────┘  announce└──────────────────┘
```

### 5.2 Settings shape (single source of truth)

```js
{
  schemaVersion: 3,
  activeProfileId: 'custom',            // 'lowVision' | 'motionSensitive' | 'screenReader' | 'reading' | 'highGlare' | 'custom' | user id
  visual: {
    enabled: false,
    brightness: 100,                    // 50–150 (%)
    contrast: 100,                      // 50–200 (%)
    saturation: 100,                    // 0–200 (%)
    mode: 'none' | 'grayscale' | 'sepia' | 'invert' | 'smartInvert',
    dimOverlay: 0,                      // 0–80 (% black overlay; brightness-down without filters)
    target: 'document' | 'contentRoot', // see §9.2 — 'document' is the safe default
    perSiteOverridesEnabled: false,
  },
  motion: {
    reduceMotion: 'system' | 'on' | 'off',   // 'system' = prefers-reduced-motion
    pauseAnimations: false,                  // 'pause' vs 'skip'
    motionStrategy: 'pause' | 'instant',     // instant = duration 0.01ms
    pauseAutoMedia: false,                   // autoplaying video/audio > 3s (1.4.2)
    flashGuard: {
      enabled: true,
      autoDetect: true,
      action: 'pause' | 'freeze' | 'hide' | 'dim',
      minFrequencyHz: 3,                     // 2.3.1 threshold is "more than 3 per second"
      minAreaPercent: 25,                    // general flash threshold proxy
      allowlist: [],                         // selectors/keys the user permitted
      blocklist: [],
    },
  },
  reader: {
    announceVerbosity: 'minimal' | 'standard' | 'verbose',
    announceRouteChanges: true,
    ensureLandmarks: 'off' | 'suggest' | 'apply',
    labelHints: 'off' | 'suggest' | 'apply',
    altTextMode: 'off' | 'flag' | 'note',
    highlightStructure: false,           // temporary visual outline of regions/landmarks
  },
  forms: {
    enhanceErrors: 'off' | 'suggest' | 'apply',
    errorSummary: true,
    passwordToggle: true,
    capsLockWarning: true,
    revealLastChar: false,
    authAssist: { autocompleteHints: true, allowPaste: true, redundantEntry: false },
    confirmImportantActions: true,
    guardScope: ['destructive-submit', 'external-navigation', 'settings-reset'],
  },
  ui: {
    corner: 'bottom-right', offsetX: 16, offsetY: 16,
    dodgeFocusedElement: true,            // 2.4.11
    panelMode: 'popover' | 'sidebar',
    announceOnChange: true,
    announceDebounceMs: 400,
  },
  meta: { createdAt, updatedAt, lastResetAt, storageMode: 'local' | 'session' | 'memory' },
}
```

Rules: the reducer is **pure**; every writer goes through an action; unknown keys are dropped on load with a warning; every value is clamped to its documented range on both load and write; `activeProfileId` flips to `'custom'` automatically when a user edits any key a profile set.

### 5.3 State & persistence flow

```
mount → storage.load() → migrate() → sanitize/clamp → merge(OS media queries) → reducer initialState
                                   │
user input → dispatch(action) ─────┤
                                   ├─▶ selectors → appliers (visual/motion) → apply/cleanup
OS media query change ─────────────┤
                                   ├─▶ announcer (deduped, debounced, politeness-aware)
cross-tab 'storage' event ─────────┤
                                   └─▶ persist (debounce 300ms) ─▶ adapter ─▶ per-site overrides
```

- **Storage modes:** `local` → `session` → `memory`, chosen by a capability probe at mount; the active mode is surfaced in the UI (never a silent failure, per A5).
- **Migrations** are pure `state → state` functions applied in sequence; a migration failure falls back to defaults and announces "your saved preferences could not be read".
- **Cross-tab sync** listens to `storage` events and ignores its own writes via a write-token to avoid echo loops.
- **Export/import** validates the JSON against the schema, reports diffs before applying, and never imports unknown keys.

### 5.4 Apply layer

| Applier | Writes | Reversibility |
|---|---|---|
| `applyVisual` | One `<style id="a11ytb-visual">` + `--a11ytb-*` custom properties on the chosen root + `data-a11ytb-visuals="on"`; optional dim overlay element | Removes style tag, restores previous inline custom properties from a snapshot, removes overlay |
| `applyMotion` | One `<style id="a11ytb-motion">` (reduced-motion emulation / pause / instant) + optional `getAnimations()` pause set + `data-a11ytb-motion="..."` | Removes tag, `.play()`s exactly the animations it paused (tracked in a `Set`), restores attribute |
| `applyTypography` (optional, outside the 14) | `--a11ytb-text-scale` etc. on the content root | Same pattern |

All appliers are **idempotent**: calling `apply(sameSettings)` twice must produce no extra nodes and no extra style recalculations (diffing against the last applied snapshot).

### 5.5 DOM patch layer

```
domRegistry (one MutationObserver, subtree + attributes, debounced ~120ms, batched via rAF)
   ├─▶ new/changed nodes → enabled audit checks (budgeted: max N nodes per tick, idle callback)
   │        └─▶ findings[] (deduped by node+check+signature, stored in WeakMap)
   └─▶ enabled fixers → apply only findings the user confirmed (per-finding or per-check-type)
            └─▶ attributeRegistry.set(node, 'aria-label', value)  → WeakMap keeps original
```

- **Never** move, clone, or delete page nodes. Patches are attribute-level (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `role`, `autocomplete`, `data-a11ytb-fixed-*`).
- Findings carry `{ id, checkId, severity, wcag: [{id, level}], target, message, suggestion, fixId, confidence }` so the UI and the announcer share one model.
- The observer is paused while we write our own attributes (`takeRecords()` + a write-flag) to prevent feedback loops.

### 5.6 Announcer service

- Two regions mounted once, **present and empty before any message** (a region added together with its text is often missed by screen readers).
- API: `announce(message, { politeness: 'polite'|'assertive', source, dedupeKey, delayMs })`.
- Queue + coalescing: identical consecutive messages collapse; rapid slider changes are debounced (default 400 ms) and announced as a final value with `aria-valuetext`-style phrasing ("Brightness 120 percent").
- Every feature announces through this one service, which is what makes #7 real rather than decorative.
- Route/title announcement: patch `history.pushState`/`replaceState` + `popstate` + `MutationObserver` on `<title>`, then announce "Navigated to <title>" — with a "this page may not announce its own changes" honesty note in the UI.

### 5.7 Confirm service

`confirmService` owns **one** dialog host; `useConfirm()` returns `confirm({ title, body, confirmLabel, cancelLabel, destructive, details })` → `Promise<boolean>`. Built on `<dialog>` (native focus trap, Esc, top layer, inert background) with an explicit fallback path if `<dialog>` is unavailable. Focus returns to the invoking control; the dialog is `aria-labelledby` + `aria-describedby`; destructive confirms default focus to **Cancel**. Used by #13 reset, #4/#5/#6 patches, #10 paste/storage changes, #11 page guard, and export/import.

---

## 6. Feature designs (the 14)

Each entry: **panel/UI**, **state keys**, **runtime side effects**, **a11y acceptance criteria**.

### 1. Flashing content protection — `features/flashing/`
- **Detection tiers.** (i) `document.getAnimations()` + `effect.getKeyframes()`/`getTiming()` → estimate flashes/sec and luminance delta from opacity/background/color/filter keyframe pairs (dependency-free, works for CSS animations, transitions, and WAAPI). (ii) Media heuristics: `<video autoplay>`, `<marquee>`, `<blink>`, animated GIF (`src` match + `<img>` with no `alt` heuristics), `data-flash`-style hints, elements whose only animation toggles visibility. (iii) Optional same-origin `<video>` frame luminance sampling via canvas. (iv) Manual: "something on this page is flashing" → pick element mode.
- **Actions:** pause / freeze at current frame / hide (with a placeholder + restore) / dim below threshold. Master "pause all motion" switch is deterministic and always available.
- **Honesty:** this is a *heuristic* guard against the common cases; it cannot certify 2.3.1, cannot see into cross-origin iframes/canvas/video pixels, and threshold estimates are approximations of the general-flash and red-flash rules.
- **A11y criteria:** every control keyboard operable; actions announced; hidden content always has a reversible affordance; the guard must not create flashing itself (no animated transitions in the panel); respects reduced-motion.

### 2. Brightness / color intensity adjustment — `features/visuals/`
- **UI:** preset buttons (Normal / Brighter / Darker / High contrast / Grayscale / Sepia / Invert) + sliders (brightness, contrast, saturation, dim) + "apply to: whole page / content area" + per-feature reset.
- **Side effects:** filters on the target root (§9.2), optional dim overlay, `filter: invert(1) hue-rotate(180deg)` for the content and a counter-invert for `img, video, picture, canvas, svg image` in invert mode.
- **Honesty:** filters change perception, not the source colors; contrast ratios (1.4.3/1.4.11) are an author responsibility. Dark/invert filters cannot re-invert CSS background images reliably — documented in-panel. Forced-colors mode disables our filters (never fight Windows High Contrast).
- **A11y criteria:** the toolbar chrome stays unfiltered/unaffected; sliders expose `aria-valuetext` with units; presets are radio-like with `aria-pressed`; changes announced (debounced); a visible "this does not fix the site's contrast" note (2.5.8 target size for every button; 24×24 minimum).

### 3. Screen reader compatibility — `features/screenReader/`
- **Two halves.** (a) *Guarantee for our own UI*: everything in `ui/` follows APG, tested with NVDA + VoiceOver. (b) *Audit engine* over the page: interactive elements without accessible names, images without alt, fields without labels, invalid `role`/ARIA attributes, focusable elements inside `aria-hidden="true"`, positive `tabindex`, untitled iframes, duplicate ids referenced by ARIA, skipped heading levels (advisory), form errors not programmatically associated.
- **UI:** findings list grouped by severity with "jump to element" (scroll + temporary outline, then focus) and "apply suggested fix" (confirm-first, per-fix or per-check-type), plus a "copy report" action (plain text) so site owners get the list.
- **A11y criteria:** report is a navigable list with headings and counts; jumps manage focus deliberately (never trap); applying a fix announces and offers undo; highlighting uses a non-colour-only indicator (outline + label).

### 4. Image alternative text — `features/altText/`
- **Detect:** missing `alt`, `alt=""` on informative-looking images, filename-like alt (`IMG_1234.jpg`), alt identical to adjacent text, `role="presentation"` misuse, images of text (heuristic: image with text-like contrast? → advisory only), `<svg>` without title, `<input type="image">` without alt.
- **Assist, not invent:** per-image list with thumbnail-free preview, prefilled suggestion from nearby caption/heading/`title` (clearly labelled "suggested, please verify"), a personal note field stored locally, "mark as decorative" (applies `alt=""` + `role="presentation"` — opt-in, reversible), and a task list export for the content owner.
- **A11y criteria:** list is keyboard navigable; notes are not auto-injected as real alt text unless the user explicitly approves per image; announces how many images were patched; never claims the resulting alt text is *correct*, only present.

### 5. Accessible form labels — `features/formLabels/`
- **Detect:** no `<label for>`, no wrapping label, no `aria-label`/`aria-labelledby`, `aria-labelledby` pointing to a missing id, `placeholder` used as the only label, group controls (`radio`/`checkbox` sets) without `fieldset`/`legend`, buttons with icon-only content and no name.
- **Suggest (ranked, confidence-scored):** associated `<label>` text → `aria-labelledby` → adjacent visible text → `placeholder` → `title` → nearest preceding heading → `name`/`id` token fallback.
- **Apply (opt-in, confirm-first, per field or per type):** add `aria-label`, or `aria-labelledby` pointing to an existing **light-DOM** node (never a shadow node — §3.5), and flag "label is tool-provided, not authored" in the report.
- **A11y criteria:** every suggestion reviewable with its source and confidence; applied labels announced; undo per fix + global "remove all tool-provided labels".

### 6. Accessible headings and landmarks — `features/headings/`
- **Heading outline panel:** nested outline (h1–h6) with jump links, level-skip warnings, empty-heading flags, "multiple h1" advisory, and a heuristic "is this heading actually styled text?" warning for fake headings (`<div class="h2">`).
- **Landmarks:** detect `header/nav/main/aside/footer/section[aria-label]/[role=*]`; if missing, offer to add `role="banner|navigation|main|complementary|contentinfo|search"` (opt-in, reversible) so landmark navigation and Bypass Blocks work in AT; optionally add a "Skip to main content" link that borrows the page's own `main` target.
- **A11y criteria:** outline is a real nested list with correct heading semantics; jumps move focus to the target and announce the new location; injected landmarks announced and individually undoable; conflict check before applying (never add a role where the page already has one).

### 7. Screen reader status announcements — `features/announcements/`
- **UI:** verbosity (minimal/standard/verbose), toggle for route-title announcements, "preview announcement" button, and a log of the last N announcements (helps teammates debug).
- **Service:** described in §5.6; used by all 13 other features.
- **Also:** a documented one-liner for teammates — `announce('Saved')` — so their modules stop relying on visual-only toasts.
- **A11y criteria:** the two regions exist from mount; assertive is reserved for errors/urgent; no announcement floods (rate limit + dedupe); verbosity=minimal announces only state-changing confirmations.

### 8. Accessible error messages — `features/errors/`
- **For teammates (preferred path):** `<FormField label hint error required>` wires `id`/`htmlFor`/`aria-describedby`/`aria-invalid`/`aria-required`, `<ErrorSummary>` renders a focusable summary with links to fields and correct `role`, `useFormErrors()` maps server/API error payloads to fields, and focus policy is centralised (summary on submit failure, field on blur validation) — all documented with the "3.3.1 + 3.3.3" rationale.
- **For arbitrary page forms (mitigation):** find candidate error text (`[role=alert]`, `[aria-live]`, `.error`, `[class*=error i]`, `:invalid` + adjacent text), associate by DOM proximity / `aria-describedby` presence / `for` attribute, then patch: add `aria-invalid="true"`, extend `aria-describedby` with the existing error node's id (allocate an id if needed — in our own container, not inside React-managed DOM), prefix colour-only indicators with the word "Error:", and announce via the service. Never re-enable a disabled submit button, never re-run validation, never suppress the site's own messages.
- **A11y criteria:** the patched field's accessible description is verified by re-reading the computed `aria-describedby` chain; a "review mode" shows exactly what would change before it changes; double-announcement guard (skip nodes already inside a live region).

### 9. Show / hide password — `features/password/`
- **Injection:** find `input[type=password]`, insert the toggle **adjacent to the field** in the light DOM (absolute-positioned wrapper that does not alter the field's layout box; verified via rect comparison before/after) or, if the field's container is React-managed and unsafe, render the toggle in our own overlay positioned by rect and re-positioned on scroll/resize.
- **Behaviour:** `aria-pressed` on the toggle with per-field accessible name ("Show password for Password"), `aria-controls` → field id, live announcement of the new state, selection/caret preserved, `autocomplete` untouched, no reading/storing/transmitting of the value, optional caps-lock warning (non-blocking), optional "reveal last typed character for 1s" (off by default).
- **A11y criteria:** toggle is reachable by keyboard in DOM order *after* the field (light DOM) or by an explicit accessible shortcut in overlay mode; 24×24 minimum target; icon-only toggle has an accessible name; state is conveyed by text + icon, not colour alone.

### 10. Accessible authentication — `features/auth/`
- **Runtime patches (all opt-in, confirm-first, reversible):** set `autocomplete` per 1.3.5 on detected username/email/current-password/new-password/OTP fields; remove inline/`on*` paste/copy/cut blockers on auth fields and re-enable `paste` (3.3.8); remove `autocomplete="off"`/`autocorrect="off"`/`spellcheck` blockers on auth fields; never touch `action`, tokens, or hidden fields.
- **Redundant entry (3.3.7):** optionally remember *non-sensitive* values (name/email/address) for the session to prefill repeat steps in multi-step processes; memory/session storage only, opt-in, listed in the privacy panel, one-click "clear saved entries", never passwords/OTP/payment data.
- **Detection & help:** warn when a login looks like a cognitive test (e.g. puzzle/captcha indicators, math questions, "enter the 3rd character"), point to the site's alternate path, and add the issue to the audit report for the site owner. Integration with password managers is explicitly *not* blocked (we never set `autocomplete="off"`, never intercept `submit` on auth forms).
- **Honesty:** 3.3.8 compliance is a site responsibility; a toolbar cannot make a cognition-based login conformant.
- **A11y criteria:** every patch is announced and individually reversible; privacy panel lists exactly what is stored; no value ever leaves the page; no interference with browser autofill.

### 11. Confirmation before important actions — `features/confirm/`
- **For teammates:** `useConfirm()`, `<ConfirmButton confirm={...}>`, `<ReviewAndConfirm summary={...}>` (a review step with a data summary and a clearly-labelled final action — the 3.3.4 "review, confirm" pattern for legal/financial/data submissions), plus a `useUnsavedChangesGuard()` hook.
- **For arbitrary pages (opt-in):** a `submit`-level guard for destructive-looking actions (matched on submitter text/`aria-label` vocabulary: delete, remove, cancel subscription, close account, pay, transfer, send) that shows our confirm dialog before letting the event continue; a `beforeunload`-based unsaved-change guard; confirmation before our own destructive settings actions (#13 reset, delete profile, clear stored data). Never intercept non-destructive submits; never block twice for the same action (per-action "don't ask again this session"); always allow the page's own dialog to still appear; never intercept our own UI.
- **A11y criteria:** `<dialog>` focus trap + Esc + restore; destructive default focus on Cancel; full context in the dialog (what will happen, whether it is reversible); announced on open via the dialog's own semantics (no double announcement).

### 12. Save accessibility preferences — `features/preferences/`
- Autosave (debounced), versioned schema + migrations, storage-mode indicator, cross-tab sync, opt-in per-site overrides (stored under the origin key with a plain-language explanation), export/import JSON (validated, diff-previewed), "what is stored" table, "delete my data" (clears only our namespace), and a "Reset to OS defaults" action that re-reads `prefers-reduced-motion`/`prefers-contrast`/`forced-colors`.
- **A11y criteria:** every destructive action confirmed (#11); import results announced; no page content or credentials in the export; storage failure is visible and actionable.

### 13. Reset accessibility settings — `features/reset/`
- Scope selector: full reset / visual only / motion only / reader only / forms only / this site only. Confirm-first with a plain-language summary of what changes. **One-step undo** ("Settings were reset — Undo") implemented by snapshotting the pre-reset state; live re-apply without page reload; announces completion. Reset never touches teammates' state, storage keys, or DOM outside our namespace.
- **A11y criteria:** confirm dialog is keyboard-complete; result announced; undo reachable by keyboard and time-bounded (e.g. 10 s) with an explicit note that it expires.

### 14. Accessibility profiles — `features/profiles/`
- Built-in presets (each a **partial settings patch**, applied over current settings with a visible diff): Low vision, Motion sensitive, Reading / dyslexia-friendly, Screen-reader & keyboard, High-glare / bright environment, plus user-defined profiles (create from current settings, rename, duplicate, delete, export).
- Switching announces ("Profile: Low vision applied — 6 settings changed"), stays fully editable, and flips to `custom` on any manual change (never silently re-applies a profile, never overrides an explicit user choice).
- **Honesty in UI copy:** presets are starting points, not diagnoses or clinical recommendations; individual needs vary.
- **A11y criteria:** profile picker is a native radio group / select with `fieldset`+`legend`; applied diff is listed in text; delete requires confirmation; keyboard reachable.

---

## 7. Integration contract (the public entry point)

Teammates must be able to integrate without reading my internals. `src/accessibility/index.js` exports exactly this surface (plus `A11Y_API_VERSION`):

```js
// ── Component / mount ────────────────────────────────────────────────
export default AccessibilityModule;                  // <AccessibilityModule config={...} />
export { AccessibilityProvider };                     // hooks-only usage, no chrome
export { mountAccessibilityToolbar };                 // (config) => { unmount, open, close, getSettings, setSettings, subscribe }
export { A11Y_API_VERSION };

// ── For the main toolbar UI ──────────────────────────────────────────
export { a11yFeatures, getA11yFeature };              // feature descriptors for rendering a launcher
export { ToolbarLauncher, PanelHost };                // render-by-id if teammates own the chrome
export { defaultConfig };

// ── Hooks teammates may share (optional, additive) ───────────────────
export { useA11ySettings, useA11ySetting, useA11yActions };
export { useAnnounce };                               // (message, {politeness}) => void
export { useConfirm };                                // ({title, body, destructive}) => Promise<boolean>
export { useUnsavedChangesGuard };
export { useFeatureStatus };                          // { isEnabled, findingCount } for badge counts

// ── Components teammates may share (forms) ───────────────────────────
export { FormField, ErrorSummary, ConfirmButton, ReviewAndConfirm, VisuallyHidden };

// ── Non-React bridge ────────────────────────────────────────────────
export { events };                                    // EVENTS constants + typed emit helpers
```

**Feature descriptor** (what the main toolbar renders, so teammates never import my panels directly):

```js
{
  id: 'flashing',
  title: 'Flashing content protection',
  group: 'motion',                       // motion | reader | forms | personalization
  capability: 'toolbar',                 // toolbar | assisted | page-required  (see §2)
  wcag: [{ id: '2.3.1', level: 'A' }, { id: '2.2.2', level: 'A' }],
  Panel: lazy(() => import('./features/flashing/FlashingPanel.jsx')),
  badge: ({ settings, engine }) => engine.flashGuard.flaggedCount || 0,
}
```

**Config** (`defaultConfig` merged with yours; unknown keys warn in dev):

```js
{
  contentRoot: null,                // selector; null = auto-resolve
  mountTarget: null,                // where the shadow host is appended; default document.body
  storageKeyPrefix: 'assistaccess.a11y',
  storage: 'auto' | 'local' | 'session' | 'memory',
  defaultProfileId: 'none',
  locale: 'en',
  strings: {},                      // partial overrides merged over strings.js
  position: { corner: 'bottom-right', offsetX: 16, offsetY: 16 },
  features: { enabled: [...], disabled: [...] },
  theme: { /* --a11ytb-* token overrides */ },
  onSettingsChange: (settings, meta) => {},
  onFinding: (finding) => {},
  announce: true,                   // set false if the host owns announcements
}
```

**Events** (window `CustomEvent`s for non-React teammates): `a11ytb:ready`, `a11ytb:settings-changed`, `a11ytb:panel-opened`, `a11ytb:panel-closed`, `a11ytb:announce`, `a11ytb:finding`, `a11ytb:fix-applied`, `a11ytb:reset`, `a11ytb:profile-changed`.

### 7.1 Integration rules I commit to

1. No global CSS: no `*`, `html`, `body`, or bare-element selectors; page rules only under our own data attribute on the chosen root, with `:where()` where possible.
2. One `<style>` per concern, ids `a11ytb-*`, all removed on unmount. Every `!important` lives in `forcedStyles.js` with a per-rule justification comment.
3. Attribute patches are `data-a11ytb-*` / standard ARIA only; originals kept in `WeakMap`s; "Remove all tool fixes" is one action.
4. Our DOM lives in a shadow host that is a **sibling of the app root** — React never renders into it and never deletes it. We never touch a node inside a teammate's React container except via namespaced attributes, and never insert children there.
5. Class/attribute hooks teammates may use: `a11ytb-reduce-motion` (on the content root when motion is reduced) and `--a11ytb-motion-scale` (0 or 1) so their CSS can cooperate without us overriding it; `data-a11ytb-exclude` marks any subtree we must ignore.
6. Full teardown on unmount: style tags, overlay, live regions, observers, timers, `history` patches, injected toggles, ARIA attributes, listeners — verified by tests.
7. No network, no analytics, no storage of credentials or page content; export/import contains settings only.
8. Additive API: new optional config keys and new exports only; anything breaking bumps `A11Y_API_VERSION` and is documented.

**Accessibility acceptance criteria for the integration itself:** axe-core clean on our panel; complete keyboard walkthrough with visible focus; Esc closes and restores focus; works at 400% zoom / 320 px width and 1.4.12 text-spacing overrides; `forced-colors: active` legible; `prefers-reduced-motion: reduce` honoured; no focus trap outside dialogs; toolbar never obscures the focused element (2.4.11) — with an automated `focusDodge` check.

---

## 8. UI primitives, keyboard & focus spec

| Pattern | Implementation | APG reference |
|---|---|---|
| Launcher | `<button aria-expanded aria-controls>`; panel opens from it; Esc/outside-click closes | Disclosure / dialog (non-modal) |
| Panel | `role="dialog"` + `aria-label`, **no** `aria-modal` (non-modal popover), focus moves to the panel's first heading on open, returns to launcher on close | Dialog (non-modal) |
| Sections | `<h3>`-level headings + disclosure buttons with `aria-expanded`/`aria-controls` | Accordion / Disclosure |
| Switch | `<button role="switch" aria-checked>` + visible "On/Off" text (never colour alone) | Switch |
| Slider | native `<input type="range">` + paired numeric input + `aria-valuetext` with units | Slider |
| Radio group | native `<input type="radio">` inside `<fieldset><legend>` | Radio group |
| Select | native `<select>` — no custom listbox (fewer failure modes, better AT support) | — |
| Dialog | native `<dialog>` + `showModal()`; Esc, focus trap, restore; destructive → Cancel focused | Dialog (modal) |
| Findings list | semantic list with headings, counts, "jump" buttons | — |
| Toolbar positioning | corner presets (keyboard-accessible) + optional drag **with** a non-drag alternative (2.5.7); `focusDodge` shifts/collapses the panel when it would overlap the focused element (2.4.11) | — |

Global UI rules: `:focus-visible` outline ≥2 px with ≥3:1 contrast against adjacent colours and never suppressed (2.4.7); every target ≥24×24 CSS px with adequate spacing (2.5.8) and 44 px preferred; no keyboard traps (2.1.2); no interaction purely by drag/hover (1.4.13 / 2.5.7); panel scrolls and wraps at 400% zoom (1.4.10) and tolerates 1.4.12 overrides; `forced-colors` and `prefers-contrast` supported; toolbar's own animations respect reduced motion.

---

## 9. Styling & isolation strategy

### 9.1 Our chrome: Shadow DOM
`attachShadow({ mode: 'open' })` on a host element appended to `document.body` (sibling of `#root`). Styles adopted from `ui/styles/*` via `adoptedStyleSheets` (with a `<style>` fallback). Consequences: teammates' CSS cannot break our panel (including their global resets, `box-sizing`, or font rules), and our CSS cannot leak. Tokens are CSS custom properties, so teammates can restyle us through `config.theme` without touching our files.

**Shadow DOM caveat we design around:** IDREF attributes do not cross the shadow boundary, so no page element may be described by a node inside our shadow root. Page-facing ARIA references light-DOM ids only (injected helper nodes, if unavoidable, go into a light-DOM container that we own and that is not inside a React-managed subtree).

### 9.2 Page effects: where filters may be applied

| Strategy | Where `filter` goes | Why | Risk |
|---|---|---|---|
| `document` (default) | `document.documentElement` | Per the Filter Effects spec, a non-`none` filter creates a containing block for fixed/absolute descendants **unless the element is the document root** — so `position: fixed` children (teammate modals, sticky headers) keep working | The filter also applies to our chrome. Mitigation: counter-filter our shadow host (inverse brightness/contrast), and/or render the panel in the top layer (a modal dialog / popover escapes ancestor clipping and transforms). Top-layer vs ancestor-`filter` behaviour is verified in a browser test in Phase 2 — the counter-filter is the guaranteed fallback, so the design does not depend on it |
| `contentRoot` (opt-in) | a resolved content element (`config.contentRoot` → `main` → `[role=main]` → `#root` → `body`) | Keeps our chrome and any teammate toolbars pristine | Filtering a non-root element **does** create a containing block, so `position: fixed` descendants inside that subtree can break. Config validation warns and the panel shows a one-time caution |
| Dim overlay | separate `position: fixed`, `pointer-events: none` layer below our chrome | Brightness-down without filters, zero layout impact | Cannot dim below-black; blocked by elements with very high z-index — documented |

Text scale (if we ship the optional typography extension) uses a **percentage** on the root so the user's browser font-size preference is respected, never a fixed `px` value.

### 9.3 Forced-colors / high-contrast
When `forced-colors: active` or `prefers-contrast: more` is detected: suspend filters/overlays (they fight the OS), show a notice in the panel, and style our chrome with system colour keywords (`Canvas`, `CanvasText`, `Highlight`, `ButtonText`) plus 1 px borders so state is visible without colour.

---

## 10. Working alongside three other modules

| Concern | Owner | Rule for me |
|---|---|---|
| `documentElement` inline style | **me only** | Write only `--a11ytb-*` properties; snapshot + restore |
| Route change announcements | **me only** | Teammates call `announce()`; if another module already announces route changes, my detection is disabled via `config.reader.announceRouteChanges` and the duplicate is suppressed via a shared `dedupeKey` |
| Live regions | **me only** (2 regions) | Teammate modules must not create their own live regions if we are mounted; documented in the integration guide |
| Global `keydown` shortcuts | shared registry | I register only through `events` with a namespaced hotkey and never `preventDefault` unless I own the key; I check for input focus first |
| `position: fixed` overlays | coordinate z-index | My tokens expose `--a11ytb-z-toolbar`; default below native `<dialog>` top layer |
| Page semantics patches | **confirm-first**, and I must not double-patch | Before applying, check `data-a11ytb-*` markers and existing ARIA; report conflicts instead of overwriting |
| Teammates' React subtrees | read-only | Attributes only, never children/order, never state |
| Global CSS | nobody | Both sides use scoped/shadow styles |

**Conflict test fixture (`integration/devHarness/`)** — a deliberately hostile host app: its own `#root`, CSS reset + `* { box-sizing }` + aggressive element selectors, fixed/sticky elements, animated marquees, a GIF, a modal, two forms (one good, one broken), a password field with paste blockers, its own live region and its own confirm dialog, plus 2,000 generated nodes for performance. Every phase must pass against this fixture.

---

## 11. Data-flow walkthroughs

1. **User drags the brightness slider.** `SliderControl.onChange` → `dispatch({type:'visual/set', key:'brightness'})` → reducer (pure, clamped) → `applyVisual` diffs and writes one custom property on the chosen root → `announce('Brightness 120 percent', {dedupeKey:'visual.brightness', delayMs:400})` → debounced persist → `a11ytb:settings-changed` event → teammates (if they listen) react. Undo = slider back / "Reset visual".
2. **Flash guard flags an animation.** `animationInventory` (from `domRegistry`) → `flashEstimator` computes 4.2 flashes/s + 31% area → finding created → if `action:'pause'`, animations are paused and tracked in a `Set`, element marked `data-a11ytb-flashguard="paused"`, placeholder shown if `action:'hide'` → `announce` → panel badge count increments → user can allowlist the element (persisted) or undo (`.play()` + attribute removed).
3. **Profile switch.** Profile selector → `profilePresets[id].patch` → single `dispatch({type:'profile/apply'})` producing one atomic state (never N sequential writes) → appliers run once → announcer reports the diff count → persist → `a11ytb:profile-changed` → any manual edit afterwards sets `activeProfileId:'custom'` and announces that the profile is no longer in effect.

---

## 12. Testing & QA strategy

| Level | Tooling | What is covered |
|---|---|---|
| Unit | Vitest | reducer purity, clamping, migrations v1→v3, flash estimator maths, colour/luminance helpers, label-suggestion ranking, JSON import validation |
| Component | Vitest + React Testing Library | primitives (keyboard, names, states), panels render + announce, confirm dialog focus behaviour |
| A11y assertions | `jest-axe` / `axe-core` in component tests | no violations on our own UI (the toolbar must pass its own audit) |
| Browser E2E | Playwright | real `getAnimations()`, filters + fixed-position regression, 400% zoom, 320 px reflow, `forced-colors` emulation, `prefers-reduced-motion` emulation, focus-dodge |
| Teardown / leak | Vitest + Playwright | mount↔unmount ×20 → zero leftover style tags, `data-a11ytb-*` attributes, observers, timers, listeners, live regions, `documentElement` inline props |
| Conflict | Playwright against the hostile fixture | no interference with teammate chrome, modals, live regions, forms |
| Manual AT | NVDA + Firefox, VoiceOver + Safari, TalkBack (best effort) | announcements, labels, dialog behaviour, outline/landmark navigation |
| Manual keyboard | checklist | full traversal, Esc, focus visibility, no traps, target sizes |
| Performance | Playwright trace + budget | audit ≤50 ms per debounced batch over 2,000 nodes; no forced synchronous layout in the observer path; idle-callback scheduling |

Definition of done for every feature: unit + component tests, axe clean, keyboard-only pass, announced state changes, teardown test, documented in the integration guide, and a WCAG reference row in the report.

---

## 13. Top risks & mitigations

1. **Runtime patches break sites.** → confirm-first, attribute-only, individually undoable, "audit-only" default, per-fix provenance in the report.
2. **`filter` breaks `position: fixed` in teammate UI.** → default to the document root (spec-exempt), opt-in content-root mode with a warning, dim-overlay alternative, browser regression test.
3. **React reconciliation deletes injected nodes.** → never insert into React containers; shadow host is a sibling of the app root; overlay mode for password toggles when a container is unsafe.
4. **Shadow DOM breaks ARIA references.** → page-facing references use light-DOM ids only; documented rule; test fixture with a page label association.
5. **Double announcements (ours + the page's).** → skip nodes already in a live region, dedupe keys, verbosity setting, route-announce toggle.
6. **Filter/flash changes make things *worse*.** → always reversible, presets bounded, forced-colors suspension, "this does not fix the site" notices, undo everywhere.
7. **Overriding user's OS/AT settings.** → `system` is the default source for motion/contrast; explicit user overrides are announced and visible in the panel.
8. **Performance on huge DOMs.** → one debounced observer, budgeted batches, idle scheduling, node caps with "scan more" affordance.
9. **Storage loss / private mode.** → capability probe, visible active mode, export/import escape hatch, migration failure fallback.
10. **Scope creep beyond the 14.** → the optional typography extension is fenced behind a clearly labelled "extension" group and off by default.

---

## 14. Implementation order

Each phase ends with something demoable and testable against the hostile fixture. Sizes are relative (S/M/L/XL), not calendar commitments.

| Phase | Deliverable | Features | Size | Depends on |
|---|---|---|---|---|
| **0. Foundation** | Config + constants + strings, folder skeleton, tokens + CSS isolation, shadow host, `devHarness` fixture, ESLint (`jsx-a11y`), test setup, design-system primitives (Switch, Slider, RadioGroup, Disclosure, VisuallyHidden, Panel, IconButton) | — | M | — |
| **1. State core** | `settingsSchema`, reducer, context + hooks, storage adapters + probes, migrations, cross-tab sync, announcer service + live regions, `domScope`, `domRegistry`, `attributeRegistry`, confirm service + `ConfirmDialog` | (enables all) | L | 0 |
| **2. Motion & sensory** | Flash detection inventory + estimator + actions + panel; visual filters/dim + presets + sliders + target strategy + panel; reduced-motion resolution incl. `prefers-reduced-motion` + cooperation hooks | 1, 2 | L | 1 |
| **3. Reading & announcements** | Screen-reader compat audit engine + findings model + report UI + fix pipeline; announcements feature (verbosity, preview, log, route/title detection, `useAnnounce`) | 3, 7 | L | 1 |
| **4. Page semantics** | Image alt scan/note/decorative; form-label scan + ranked suggestions + apply; heading outline + landmark detection/injection + skip link | 4, 5, 6 | XL | 3 |
| **5. Forms & interaction** | `FormField`/`ErrorSummary`/`useFormErrors` + page error associator; password toggle injection; auth assist (autocomplete, paste, redundant entry, privacy panel); confirm service features (`useConfirm`, `ConfirmButton`, `ReviewAndConfirm`, action guard) | 8, 9, 10, 11 | XL | 1 (validation via 3) |
| **6. Personalization** | Autosave polish, per-site overrides, export/import, data transparency; reset with scopes + undo; profile presets + user profiles + diff reporting | 12, 13, 14 | L | 1, and #11 for confirmations |
| **7. Hardening** | Full keyboard/AT matrix, 400% zoom + reflow, forced-colors, reduced-motion, teardown/leak suite, perf budget, integration guide + per-feature WCAG report, API freeze + `A11Y_API_VERSION` | all | M–L | all |

Ordering rationale: the announcer and settings store precede everything (they are shared infrastructure, and #7 is only credible if the other features actually use it); the audit engine precedes the semantics features (§4–6 and the page-side half of §8 all consume findings); the confirm service precedes reset/profiles and the destructive patches; personalization comes last because profiles are only meaningful once the settings they bundle exist.

**Per-phase exit criteria** (all four required): (a) axe clean on our UI, (b) keyboard-only pass + visible focus, (c) state changes announced and reversible, (d) teardown leaves zero residue on the hostile fixture.

---

## 15. What I need from you before writing code

1. **Approval of this architecture** (or the specific changes you want).
2. Answers to the three open questions in §1 (existing launcher pattern / hook surface / non-React mount).
3. Confirmation of two defaults that affect the team: **Shadow DOM chrome** (A3) and **confirm-before-apply for all page-semantics patches** (A7). Both are reversible decisions now and expensive later.
4. Whether Phase 0+1 (foundation + state core, no user-facing features) is the right first implementation slice — I recommend it: it produces the shared infrastructure, the hostile-host fixture, and test scaffolding that every later phase reuses, so you can review the integration contract before any feature code exists.

If you approve, I will implement Phase 0 and Phase 1 only, then stop for review before touching any of the 14 features.

---

## 16. References

- WCAG 2.2 — key success criteria referenced above: 1.1.1, 1.3.1, 1.3.5, 1.4.2, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.1.1, 2.1.2, 2.2.1, 2.2.2, 2.3.1, 2.3.3, 2.4.1, 2.4.2, 2.4.3, 2.4.6, 2.4.7, 2.4.11, 2.4.13, 2.5.3, 2.5.7, 2.5.8, 3.2.1, 3.2.2, 3.2.6, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.7, 3.3.8, 4.1.2, 4.1.3. Note 4.1.1 Parsing is obsolete in WCAG 2.2.
- WAI-ARIA Authoring Practices — Disclosure, Dialog (modal/non-modal), Switch, Slider, Radio Group, Accordion.
- WAI-ARIA 1.2 — `role="status"`, `role="alert"`, `aria-describedby`/`aria-invalid` error patterns.
- CSS Filter Effects + CSS Position Layout — filter-created containing blocks and the document-root exception; top layer behaviour.
- `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` media queries; Web Animations API (`getAnimations`, `getKeyframes`, `getTiming`).
- WCAG general flash and red flash thresholds (2.3.1) — used only as an *estimate* in the guard, never as a conformance claim.
