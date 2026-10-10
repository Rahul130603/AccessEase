/**
 * Accessibility profiles.
 *
 * A profile is **a named patch of existing settings** — nothing more. It contains no
 * visual implementation of its own: applying a profile merges the keys it names into
 * the same store every other feature writes to, so the appliers, persistence,
 * announcements and the audit all keep working exactly as they do for a manual
 * change. That is what keeps profiles honest and cheap to maintain.
 *
 * Rules that keep them from surprising anyone
 * -------------------------------------------
 *  1. A profile changes only the keys it lists. Groups and keys it does not mention
 *     are left exactly as the user had them.
 *  2. It never touches `motion.flashGuard.allowlist` (per-page decisions the user
 *     made), and it cannot reach a group owned by another module —
 *     `sanitizeSettingsPatch` rejects anything outside PATCHABLE_GROUPS.
 *  3. It never forces motion *on* against the operating system. "Default" sets
 *     `reduceMotion: 'system'`, which means "follow the OS", and the motion profiles
 *     only ever ask for *less* motion than the system would allow.
 *  4. When the user changes a key that a profile set, the panel stops claiming that
 *     profile is active: the displayed profile is derived on every render by
 *     comparing the settings with the profile's patch, and becomes "Custom".
 *
 * The four built-ins below are named after the intent, not after a diagnosis:
 * profiles are starting points, not clinical recommendations, and every value
 * remains adjustable afterwards.
 */

import { sanitizeSettingsPatch, snapshotSettingsPatch, VISUAL_DEFAULTS } from '../settingsSchema.js';

export const DEFAULT_PROFILE_ID = 'default';
export const CUSTOM_PROFILE_ID = 'custom';

/**
 * Built-in profiles. Each `patch` is validated by sanitizeSettingsPatch before use.
 */
export const BUILT_IN_PROFILES = Object.freeze([
  {
    id: DEFAULT_PROFILE_ID,
    label: 'Default',
    description:
      'No visual adjustment, and motion follows your operating system setting. This is what a full reset returns to.',
    patch: {
      visual: { ...VISUAL_DEFAULTS, enabled: false, target: 'document' },
      motion: {
        // 'system' rather than 'off': the operating system preference keeps winning.
        reduceMotion: 'system',
        motionStrategy: 'instant',
        pauseAnimations: false,
        pauseAutoMedia: false,
        flashGuard: { enabled: true, autoDetect: true, action: 'pause' },
      },
    },
  },
  {
    id: 'reducedMotion',
    label: 'Reduced motion',
    description:
      'Animations finish immediately instead of moving, autoplaying media is stopped, and flashing protection pauses what it detects. Colours are left alone.',
    patch: {
      motion: {
        reduceMotion: 'on',
        motionStrategy: 'instant',
        pauseAutoMedia: true,
        pauseAnimations: false,
        flashGuard: { enabled: true, autoDetect: true, action: 'pause' },
      },
    },
  },
  {
    id: 'lowStimulation',
    label: 'Low stimulation',
    description:
      'Dimmer, lower-contrast, less saturated colours, plus motion held still. Adjust the sliders afterwards if it goes too far.',
    patch: {
      visual: { enabled: true, brightness: 95, contrast: 90, saturation: 55, target: 'document' },
      motion: {
        reduceMotion: 'on',
        motionStrategy: 'instant',
        pauseAnimations: true,
        pauseAutoMedia: true,
        flashGuard: { enabled: true, autoDetect: true, action: 'pause' },
      },
    },
  },
  {
    id: 'enhancedContrast',
    label: 'Enhanced contrast',
    description:
      'Raises contrast to 130% for reading. Motion settings are untouched, so this combines with the motion profiles only if you change them yourself.',
    patch: {
      visual: { enabled: true, brightness: 100, contrast: 130, saturation: 100, target: 'document' },
    },
  },
]);

function normalizeProfile(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const id = typeof entry.id === 'string' ? entry.id.trim().slice(0, 80) : '';
  const label = typeof entry.label === 'string' ? entry.label.trim() : '';
  if (!id || !label) return null;
  const patch = sanitizeSettingsPatch(entry.patch);
  if (Object.keys(patch).length === 0) return null;
  return {
    id,
    label,
    description: typeof entry.description === 'string' ? entry.description : '',
    patch,
    source: entry.source || 'built-in',
  };
}

/**
 * All profiles available to the user: built-ins, then any the host app configured
 * (which may override a built-in by reusing its id), then the user's own.
 *
 * @param {{config?: object, settings?: object}} options
 */
export function getProfiles({ config, settings } = {}) {
  const byId = new Map();
  BUILT_IN_PROFILES.map((entry) => normalizeProfile({ ...entry, source: 'built-in' })).forEach(
    (profile) => {
      if (profile) byId.set(profile.id, profile);
    },
  );

  const configured = config && Array.isArray(config.profiles) ? config.profiles : [];
  configured
    .map((entry) => normalizeProfile({ ...entry, source: 'configured' }))
    .forEach((profile) => {
      if (profile) byId.set(profile.id, profile);
    });

  const user = (settings && settings.profile && settings.profile.user) || [];
  user
    .map((entry) => normalizeProfile({ ...entry, source: 'user' }))
    .forEach((profile) => {
      if (profile) byId.set(profile.id, profile);
    });

  return Array.from(byId.values());
}

export function findProfile(profiles, id) {
  return (profiles || []).find((profile) => profile.id === id) || null;
}

function clampPatchValue(group, key, value) {
  const patch = sanitizeSettingsPatch(
    group === 'flashGuard' ? { motion: { flashGuard: { [key]: value } } } : { [group]: { [key]: value } },
  );
  if (group === 'flashGuard') {
    return patch.motion && patch.motion.flashGuard ? patch.motion.flashGuard[key] : undefined;
  }
  return patch[group] ? patch[group][key] : undefined;
}

function equalValues(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Does the current state still match the patch a profile applied?
 * Only the keys the patch names are compared: a profile makes no claim about the
 * rest of the settings, so changing something unrelated must not switch the panel to
 * "Custom".
 */
export function matchesProfilePatch(settings, patch) {
  const safe = sanitizeSettingsPatch(patch);
  if (!settings || Object.keys(safe).length === 0) return false;

  return Object.keys(safe).every((group) => {
    const groupPatch = safe[group];
    return Object.keys(groupPatch).every((key) => {
      if (group === 'motion' && key === 'flashGuard') {
        const guardPatch = groupPatch.flashGuard;
        return Object.keys(guardPatch).every(
          (guardKey) => settings.motion.flashGuard[guardKey] === guardPatch[guardKey],
        );
      }
      const expected = clampPatchValue(group, key, groupPatch[key]);
      return settings[group] ? equalValues(settings[group][key], expected) : false;
    });
  });
}

/**
 * The profile to display: the recorded profile when the settings still match it,
 * otherwise "Custom".
 *
 * @returns {{ id: string, profile: object|null, isCustom: boolean }}
 */
export function resolveActiveProfile(settings, profiles) {
  const recorded = (settings && settings.profile && settings.profile.id) || DEFAULT_PROFILE_ID;
  const profile = findProfile(profiles, recorded);
  if (!profile) return { id: CUSTOM_PROFILE_ID, profile: null, isCustom: true };
  if (!matchesProfilePatch(settings, profile.patch)) {
    return { id: CUSTOM_PROFILE_ID, profile: null, isCustom: true };
  }
  return { id: profile.id, profile, isCustom: false };
}

/**
 * How many individual keys a patch would change, for the announcement after applying
 * a profile. Unknown groups are ignored.
 */
export function countPatchChanges(settings, patch) {
  const safe = sanitizeSettingsPatch(patch);
  let count = 0;
  Object.keys(safe).forEach((group) => {
    const groupPatch = safe[group];
    if (group === 'motion' && groupPatch.flashGuard) {
      Object.keys(groupPatch.flashGuard).forEach((key) => {
        if (settings.motion.flashGuard[key] !== groupPatch.flashGuard[key]) count += 1;
      });
    }
    Object.keys(groupPatch).forEach((key) => {
      if (key === 'flashGuard') return;
      const expected = clampPatchValue(group, key, groupPatch[key]);
      if (!settings[group] || !equalValues(settings[group][key], expected)) count += 1;
    });
  });
  return count;
}

/** A patch of everything a profile may control, taken from the current settings. */
export function buildUserProfilePatch(settings) {
  return snapshotSettingsPatch(settings);
}

/** Slug + suffix id for a user profile, generated outside the reducer. */
export function createUserProfileId(label) {
  const slug = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `user:${slug || 'profile'}:${suffix}`;
}
