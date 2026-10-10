/**
 * defaultSettings — the documented default configuration.
 *
 * This is the single source of truth for what a fresh install (and a reset) looks like.
 * The reset panel renders `createDefaultSettings()` verbatim, so the table below and the
 * shipped defaults cannot drift apart, and the self-test asserts the values.
 *
 * | Group     | Defaults                                                                                          |
 * |-----------|---------------------------------------------------------------------------------------------------|
 * | `visual`  | `enabled: false`, `brightness: 100`, `contrast: 100`, `saturation: 100`, `target: 'document'`       |
 * | `motion`  | `reduceMotion: 'system'`, `motionStrategy: 'instant'`, `pauseAnimations: false`, `pauseAutoMedia: false`, `flashGuard: { enabled: true, autoDetect: true, action: 'pause', allowlist: [] }` |
 * | `reader`  | `auditEnabled: true`, `announceVerbosity: 'standard'`, `announceRouteChanges: true`, `highlightOnJump: true` |
 * | `forms`   | `passwordToggle: true`, `announceErrors: false`                                                     |
 * | `ui`      | `announceOnChange: true`                                                                            |
 * | `profile` | `id: 'default'`, `appliedAt: null`, `user: []`                                                      |
 * | `meta`    | timestamps and the resolved storage mode (informational, not a preference)                          |
 *
 * Ranges (values outside them are clamped on load, on import and in a profile):
 * brightness and contrast 50–150, saturation 0–200, every step 5.
 *
 * `motion.reduceMotion: 'system'` is the important one: motion follows the operating
 * system's `prefers-reduced-motion` until the user explicitly overrides it, and the
 * built-in profiles never ask for *more* motion than the system allows.
 *
 * @example
 * import { defaultSettings, createDefaultSettings, VISUAL_RANGES } from './accessibility/defaultSettings';
 *
 * defaultSettings.visual.brightness;   // 100
 * VISUAL_RANGES.contrast.max;          // 150
 * const fresh = createDefaultSettings();   // a new, mutable copy
 */

import { createDefaultSettings, VISUAL_RANGES, PATCHABLE_GROUPS } from './core/settingsSchema.js';

export { createDefaultSettings, VISUAL_RANGES, PATCHABLE_GROUPS };

export {
  sanitizeSettings,
  migrateSettings,
  sanitizeSettingsPatch,
  sanitizeUserProfiles,
  snapshotSettingsPatch,
  resolveReducedMotion,
} from './core/settingsSchema.js';

export { DEFAULT_PROFILE_ID, CUSTOM_PROFILE_ID } from './core/profiles/profiles.js';

/** A frozen copy of the defaults, for reading and for documentation. */
export const defaultSettings = Object.freeze(createDefaultSettings());

export default defaultSettings;
