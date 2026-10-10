# Preferences, reset and profiles — integration & test guide

The last three features, and the ones that tie every earlier phase together: saved preferences,
a documented default configuration with a one-step-undo reset, and configurable profiles that are
nothing more than named patches of the settings that already exist.

| # | Feature | What it delivers |
|---|---|---|
| 1 | Save accessibility preferences | One namespaced localStorage key, validated on load, honest storage-mode reporting, exact payload visible in the panel, export/import, delete-my-data |
| 2 | Reset accessibility settings | Scoped reset (everything, or one group), applied immediately without a reload, confirmed first, undoable once for 15 seconds |
| 3 | Accessibility profiles | Default, Reduced motion, Low stimulation, Enhanced contrast + app-configured and user-saved profiles; editing one value switches the panel to Custom |

Run the automated checks first:

```bash
node src/accessibility/integration/selfTest/settingsSelfTest.mjs
# settings self-test: 28/28 checks passed
```

---

## 1. Files

```
src/accessibility/
  core/
    profiles/profiles.js        built-in profiles, getProfiles(), resolveActiveProfile(),
                                matchesProfilePatch(), countPatchChanges(), buildUserProfilePatch()
    preferencesIO.js            buildExportPayload / parseImportPayload / downloadJson / readFileText
    settingsSchema.js           + profile group, sanitizeSettingsPatch(), sanitizeUserProfiles(),
                                  snapshotSettingsPatch(), PATCHABLE_GROUPS
    settingsReducer.js          + APPLY_PATCH, RESET_SCOPE, ADD_USER_PROFILE, REMOVE_USER_PROFILE
    SettingsContext.jsx         + applyProfile, addUserProfile, removeUserProfile, resetScope,
                                  undoReset, canUndoReset, saveNow, exportPreferences,
                                  importPreferences, deleteStoredPreferences, meta.lastSavedAt,
                                  meta.storageError, meta.storageKey
  features/
    preferences/PreferencesPanel.jsx
    reset/ResetPanel.jsx
    profiles/ProfilesPanel.jsx
  integration/selfTest/settingsSelfTest.mjs   executable checks (plain node, no framework)
```

Modified additively: `constants.js` (three feature ids, `PERSONALIZATION` group, `RESET_SCOPES`,
`RESET_UNDO_WINDOW_MS`, `PROFILE_LIMITS`, five events), `config.js` (`profiles`), `strings.js`
(three copy groups + announcement templates), `features/registry.js`, `index.js`,
`ui/styles/primitives.js` (one row layout for a choice with a secondary action).
Nothing in the flashing, visual, audit, announcement or forms features was rewritten.

---

## 2. The settings API (how other components read and update settings)

One store, one provider, one persistence path. Other components never touch storage, and never need
to know that it exists.

```jsx
import { AccessibilityProvider, useA11ySettings, useA11ySetting } from './accessibility';

// Wrap the app once (AccessibilityModule does this for you).
<AccessibilityProvider config={{ storage: 'auto' }}>
  <App />
</AccessibilityProvider>
```

| API | Use |
|---|---|
| `useA11ySettings()` | `{ settings, actions, meta, config, strings }` — the whole store and every writer |
| `useA11ySetting(selector, fallback)` | one value; re-renders only when that value changes |
| `useA11ySettingsContext()` | the same object, or `null` (null-safe for components that must work without the provider) |
| `useEffectiveReducedMotion()` | the resolved motion preference: user choice, else the OS |
| `useAnnounce()` | speak a message through the shared, deduplicated live region |
| `useConfirm()` | ask for confirmation before a consequential action |

Reading and writing:

```jsx
function ContrastBadge() {
  const contrast = useA11ySetting((s) => s.visual.contrast, 100);
  const { actions, meta } = useA11ySettings();
  return (
    <p>
      Contrast {contrast}% · saved: {meta.lastSavedAt ? new Date(meta.lastSavedAt).toLocaleTimeString() : 'not yet'}
      <button type="button" onClick={() => actions.setVisualValues({ contrast: 130 })}>Raise</button>
      <button type="button" onClick={() => actions.resetScope('visual')}>Reset visual</button>
    </p>
  );
}
```

Outside React:

```js
import { subscribeToA11yEvents, EVENTS } from './accessibility';
subscribeToA11yEvents(EVENTS.SETTINGS_CHANGED, ({ settings }) => applyTheme(settings));
subscribeToA11yEvents(EVENTS.PROFILE_CHANGED, ({ id, changed }) => track(id, changed));
subscribeToA11yEvents(EVENTS.SETTINGS_RESET, ({ scope }) => trackReset(scope));
```

Rules that keep the API modular:

* **Every write goes through an action.** Nothing dispatches into the store directly, so clamping,
  persistence and announcement happen in one place.
* **Adding a group is additive.** Unknown top-level groups are preserved on load, so a later phase or
  another module can own one without this file changing.
* **A patch can only touch `PATCHABLE_GROUPS`** (`visual`, `motion`, `reader`, `forms`, `ui`), and
  `sanitizeSettingsPatch` is the single gate. Profiles and imports both go through it, which is why
  neither can reach `motion.flashGuard.allowlist` or invent a group.
* **No component stores anything itself.** There is exactly one storage key, owned by
  `core/storage.js`.

---

## 3. The default configuration

`createDefaultSettings()` in `core/settingsSchema.js` is the single source of truth, and the reset
panel renders it verbatim so the documented defaults and the shipped defaults cannot drift apart.

| Group | Default |
|---|---|
| `visual` | `enabled: false`, `brightness: 100`, `contrast: 100`, `saturation: 100`, `target: 'document'` (ranges: brightness and contrast 50–150, saturation 0–200) |
| `motion` | `reduceMotion: 'system'` (follows `prefers-reduced-motion`), `motionStrategy: 'instant'`, `pauseAnimations: false`, `pauseAutoMedia: false`, `flashGuard: { enabled: true, autoDetect: true, action: 'pause', allowlist: [] }` |
| `reader` | `auditEnabled: true`, `announceVerbosity: 'standard'`, `announceRouteChanges: true`, `highlightOnJump: true` |
| `forms` | `passwordToggle: true`, `announceErrors: false` |
| `ui` | `announceOnChange: true` |
| `profile` | `id: 'default'`, `appliedAt: null`, `user: []` |
| `meta` | timestamps, `storageMode` (informational, not a preference) |

---

## 4. Persistence

### 4.1 How it works

1. On mount, `createStorage()` probes `localStorage` → `sessionStorage` → in-memory, with a
   write/read/remove test rather than a feature check, and records which one it got.
2. The stored JSON is parsed defensively, migrated, then **clamped and enum-checked** by
   `sanitizeSettings`. A corrupt entry, an out-of-range number or an unknown value falls back to the
   default for that key and produces a warning.
3. Changes are written 300 ms after the last edit, cross-tab synchronised through the `storage`
   event, and reported in `meta.lastSavedAt` / `meta.storageError`.
4. If a write fails (private window, policy, quota), the toolbar says so once, keeps working in
   memory, and the panel states that the settings will be lost when the page closes.

### 4.2 Automated checks (executed)

`node src/accessibility/integration/selfTest/settingsSelfTest.mjs` — 28 checks, all passing. The
persistence-relevant ones:

| Check | What it proves |
|---|---|
| defaults define every documented group | the documented default configuration exists and matches the table above |
| stored values are clamped on load | `brightness: 999 → 150`, `contrast: -20 → 50`, out-of-range saturation clamped, warnings reported |
| unknown enums fall back instead of being applied | `reduceMotion: 'sometimes'`, `target: 'body'`, `action: 'explode'`, `verbosity: 'shout'` all fall back |
| groups owned by other phases survive a load | a teammate's unknown group is preserved verbatim |
| legacy payloads migrate | a v0 payload (`filters`, top-level `flashGuard`) folds into the current shape and gets `schemaVersion: 1` |
| a corrupt payload cannot poison the store | a string and an array payload both yield the defaults |
| export contains only documented keys and groups | key allowlist asserted |
| export never contains secrets or the allowlist | sentinel passwords, codes, tokens and element keys are absent from the serialised file |
| export and import round-trip | values, active profile and the resulting patch survive a full round trip |
| import rejects malformed input with a specific reason | `empty`, `invalid-json`, `not-an-object`, `no-settings`, `too-large` |
| import clamps out-of-range values | `brightness: 9000 → 150`, `contrast: 10 → 50` |
| an imported patch cannot reach the per-page allowlist | allowlist unchanged, the rest of the patch applied |

### 4.3 Manual checks (browser)

| # | Step | Expected |
|---|---|---|
| 1 | Change brightness, reload the page | The value is restored; the panel shows a “last saved” time |
| 2 | Open the panel → “Saved preferences” | Storage mode reads “this browser (localStorage)”, the key is shown, and the exact JSON is readable under “Show the saved data” |
| 3 | Read that JSON | No password, code, token, page content or allowlist appears in it |
| 4 | Edit the stored entry by hand (DevTools → Application → Local Storage): set `visual.brightness` to `9999` and `motion.reduceMotion` to `"sometimes"`, then reload | Brightness comes back as 150 and motion as “system”; the toolbar does not break |
| 5 | Replace the stored value with `{oops` and reload | The toolbar falls back to defaults and announces that saved settings could not be read |
| 6 | Open a second tab, change contrast in one, watch the other | The change appears in both |
| 7 | Use a private window (or block storage) and change a setting | The panel says storage is blocked and the settings last until the page closes — it never claims they were saved |
| 8 | Press “Save now” | An explicit confirmation of the save (or of the failure) |
| 9 | Export preferences, then import the file | Values come back; the announcement reports how many settings were applied |
| 10 | Hand-edit the exported file: add `"motion": {"flashGuard": {"allowlist": ["x"]}}` and import | The allowlist is unchanged; nothing breaks |
| 11 | Import a non-JSON file (for example a PNG renamed to .json) | A specific reason in the announcement and in the panel; nothing changes |
| 12 | Press “Remove the saved preferences from this browser” and confirm | The storage entry is gone, settings return to defaults, and the message says so |

---

## 5. Reset

### 5.1 Behaviour

* Five scopes: everything, visual, motion, reading/audit, forms — each with a plain-language
  description in the panel.
* The reset is confirmed first (the shared dialog), applied through the ordinary settings pipeline,
  and therefore visible immediately: filters come off, motion overrides are torn down, the audit and
  panels re-read the store. No reload.
* One step of undo is kept for 15 seconds, and the announcement says for how long.
* A reset keeps three things on purpose, and the panel lists them: **saved profiles** (content the
  user created), the **per-page flashing allowlist** (decisions about specific pages), and the host
  application's placement preference for the toolbar.

### 5.2 Automated checks (executed)

| Check | What it proves |
|---|---|
| reset everything returns the defaults | every group equals `createDefaultSettings()` |
| a scoped reset leaves the other groups alone | resetting visual keeps `motion.pauseAnimations` and `reader.announceVerbosity` |
| reset keeps saved profiles and the per-page allowlist | both survive a full reset |
| undo restores the previous settings exactly | a snapshot patch reapplied reproduces `visual`, `motion` and the active profile |
| the reducer is pure and does not mutate its input | input state unchanged; identical input gives identical output |

### 5.3 Manual checks

| # | Step | Expected |
|---|---|---|
| 1 | Apply “Low stimulation”, then reset “Visual adjustments” | Colours return to normal, motion settings stay as the profile left them |
| 2 | Reset “Everything” | Every value returns to the documented defaults; the radio group shows Default; filters are removed from the page immediately |
| 3 | During the 15 seconds, press “Undo the reset” | The previous settings come back exactly, including the profile that was active |
| 4 | Reset again and wait for the window to pass | The undo button disappears and the status line says the window has passed |
| 5 | Cancel the confirmation dialog | Nothing changes |
| 6 | Reset while a saved profile exists | The profile is still in the profiles panel; the panel notes that profiles are kept |
| 7 | Keyboard only: choose a scope with arrow keys, activate “Reset settings” with Space, confirm with the dialog | Every step is reachable and the dialog behaves as in the confirmation tests |

---

## 6. Profiles

### 6.1 The four built-ins

| Profile | What it patches | Why it is shaped that way |
|---|---|---|
| **Default** | `visual` back to neutral, `motion.reduceMotion: 'system'` | Returns motion control to the operating system rather than forcing it off, so `prefers-reduced-motion` keeps working |
| **Reduced motion** | `motion`: `reduceMotion: 'on'`, `motionStrategy: 'instant'`, `pauseAutoMedia: true`, `flashGuard.action: 'pause'` | Asks for *less* motion than the system would allow; never touches colours |
| **Low stimulation** | `visual`: dimmer (95), lower contrast (90), saturation 55; `motion`: reduced motion, animations paused, media paused | Combines existing settings; the sliders stay adjustable afterwards |
| **Enhanced contrast** | `visual`: contrast 130 | Leaves motion alone, so it composes with a motion profile the user picks |

### 6.2 How Custom works

`resolveActiveProfile()` compares the current settings with the patch of the profile that was
recorded as active, **on every render**. It compares only the keys that patch names.

* Change a value a profile set → the panel shows **Custom** immediately.
* Change something no profile mentions (announcement verbosity, for example) → the profile stays
  active, because the profile makes no claim about that value.
* Delete a saved profile while it is active → the values stay and the panel shows Custom.

### 6.3 Automated checks (executed)

| Check | What it proves |
|---|---|
| the four built-in profiles exist with distinct patches | ids and the key values of each patch |
| no built-in profile can force motion on against the system | no profile sets `reduceMotion: 'off'` |
| the default settings match the Default profile | `resolveActiveProfile` returns `default`, not Custom, on a fresh store |
| applying a profile uses the shared pipeline and reports the change count | Enhanced contrast reports exactly 2 changed keys |
| editing a profile value switches the displayed profile to Custom | the required behaviour, asserted directly |
| changing a setting a profile does not mention keeps the profile active | no false "Custom" |
| a profile leaves the groups it does not name untouched | a motion profile does not disturb the reader group |
| configured profiles can extend or replace the built-ins | `config.profiles` replaces `enhancedContrast` by id and adds `focus` |
| user profiles are validated, capped and deletable | 20-profile cap, label truncation, invalid entries dropped, delete leaves settings untouched |
| a snapshot patch captures settings but not the allowlist or profile list | what "save current settings" actually stores |

### 6.4 Manual checks

| # | Step | Expected |
|---|---|---|
| 1 | Choose “Enhanced contrast” | Contrast rises to 130 immediately; the announcement says 2 settings changed |
| 2 | Move the brightness slider | The status line changes to Custom with the explanation; the profile stays in the list |
| 3 | Choose “Reduced motion”, then check the visuals panel | Brightness and saturation are exactly as they were before |
| 4 | With the OS set to reduce motion, choose “Default” | The motion switch reads “Following your system setting: reduce motion is on” — the profile did not force it off |
| 5 | Type a name and press “Save this profile” | The profile appears under “Your profiles”, is selected, and the announcement confirms it |
| 6 | Try saving a name that already exists, or an empty name | The button is disabled; the status line explains why |
| 7 | Delete a saved profile and confirm | It disappears; current settings do not change |
| 8 | Apply a profile, reload the page | The same profile is still shown (and still Custom if you had edited a value) — the profile id is persisted with the settings |
| 9 | Export, then import into a browser with default settings | The imported profile appears in the list; the active profile from the file is shown |

---

## 7. What this phase deliberately does not do

* **No cross-device sync.** Preferences live in one browser on one device. Export/import is the
  supported way to move them, and the panel says so.
* **No secrets, ever.** No password, one-time code, token, session identifier or form value is
  written to the settings, the export, or anywhere else. The self-test asserts this structurally
  (the export's keys and groups are allow-listed, and sentinel secrets are absent).
* **No conflict with the operating system.** Motion defaults to `'system'`; `resolveReducedMotion`
  gives the explicit user choice priority only when the user actually made one, and the motion
  profiles never ask for *more* motion.
* **No touching other modules' state.** A profile can only write keys inside `PATCHABLE_GROUPS`; it
  cannot clear a group it does not name, cannot reach the per-page allowlist, and cannot modify the
  DOM or any other module's storage.
* **Not a compliance claim.** Saving a preference, resetting, or picking a profile changes what this
  toolbar does. It says nothing about whether the page conforms to WCAG.

---

## 8. Verification performed

* `node src/accessibility/integration/selfTest/settingsSelfTest.mjs` → **28/28 checks passed**
  (executed in this environment; two genuine bugs and three wrong assumptions in the tests were found
  and fixed this way rather than being asserted in prose).
* `node --check` on every plain-JS module, plus a static pass over every `.js`/`.jsx` file: relative
  imports resolve, no `.css` import outside the harness, balanced braces and JSX tags, no duplicate
  exports.
* Storage audit: outside `core/storage.js`, no module reads or writes `localStorage`,
  `sessionStorage`, IndexedDB or cookies.
* **Not verified here:** browser behaviour — the storage adapters, cross-tab sync, the panels, focus
  order and screen reader output need a real browser and a screen reader. Sections 4.3, 5.3 and 6.4
  are the acceptance criteria for those.
