/**
 * useAccessibilitySettings — how other components read and write settings.
 *
 * One store, one persistence path, one announcement path. Components never touch
 * storage, and never need to know that it exists.
 *
 * | Hook                             | Use                                                                 |
 * |----------------------------------|---------------------------------------------------------------------|
 * | `useA11ySettings()`              | `{ settings, actions, meta, config, strings }` — the whole store     |
 * | `useA11ySetting(selector, fb)`   | one value; re-renders only when that value changes                   |
 * | `useA11ySettingsContext()`       | the same object, or `null` — for components that must work standalone |
 * | `useEffectiveReducedMotion()`    | user choice, else the operating system preference                    |
 * | `useAnnounce()`                  | speak through the shared, deduplicated live region                   |
 * | `useConfirm()`                   | ask for confirmation before a consequential action                   |
 *
 * Reading and writing:
 *
 * @example
 * import { useA11ySettings, useA11ySetting } from './accessibility/useAccessibilitySettings';
 *
 * function ContrastBadge() {
 *   const contrast = useA11ySetting((s) => s.visual.contrast, 100);
 *   const { actions, meta } = useA11ySettings();
 *   return (
 *     <p>
 *       Contrast {contrast}%
 *       <button type="button" onClick={() => actions.setVisualValues({ contrast: 130 })}>Raise</button>
 *       <button type="button" onClick={() => actions.resetScope('visual')}>Reset visual</button>
 *       <span>{meta.lastSavedAt ? 'saved' : 'not saved yet'}</span>
 *     </p>
 *   );
 * }
 *
 * Outside React:
 *
 * @example
 * import { subscribeToA11yEvents, EVENTS } from './accessibility';
 * subscribeToA11yEvents(EVENTS.SETTINGS_CHANGED, ({ settings }) => applyTheme(settings));
 *
 * Rules that keep the API modular
 * -------------------------------
 *  - Every write goes through an action, so clamping, persistence and announcement
 *    happen in one place.
 *  - Adding a settings group is additive: unknown groups survive a load, so a later
 *    phase or another module can own one without changing the store.
 *  - A patch (from a profile or an imported file) can only touch the keys named in
 *    `PATCHABLE_GROUPS`; `sanitizeSettingsPatch` is the single gate.
 */

export {
  useA11ySettings,
  useA11ySettingsContext,
  useA11ySetting,
  useEffectiveReducedMotion,
  useAnnounce,
} from './core/SettingsContext.jsx';

export { useAudit } from './core/audit/AuditContext.jsx';
export { useConfirm } from './core/confirm/ConfirmContext.jsx';

export {
  getProfiles,
  resolveActiveProfile,
  matchesProfilePatch,
  countPatchChanges,
  BUILT_IN_PROFILES,
} from './core/profiles/profiles.js';

export { subscribeToDomChanges } from './core/dom/domRegistry.js';
