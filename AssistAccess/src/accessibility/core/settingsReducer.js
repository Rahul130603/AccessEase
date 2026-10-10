/**
 * Pure reducer for the shared settings store.
 *
 * The reducer never touches the DOM, storage, timers or announcements. All side
 * effects live in SettingsContext.jsx (appliers) and in the action creators that
 * wrap a dispatch with an announcement.
 */

import { PROFILE_LIMITS, RESET_SCOPES } from '../constants.js';
import {
  clampVisualValue,
  createDefaultSettings,
  FLASH_ACTIONS,
  FORM_BOOLEAN_KEYS,
  MOTION_STRATEGIES,
  READER_BOOLEAN_KEYS,
  REDUCE_MOTION_VALUES,
  sanitizeSettings,
  sanitizeSettingsPatch,
  sanitizeUserProfiles,
  VERBOSITY_VALUES,
  VISUAL_DEFAULTS,
  VISUAL_TARGETS,
} from './settingsSchema.js';

export const SETTINGS_ACTIONS = Object.freeze({
  HYDRATE: 'settings/hydrate',
  SET_VISUAL_ENABLED: 'visual/set-enabled',
  SET_VISUAL_VALUES: 'visual/set-values',
  SET_VISUAL_TARGET: 'visual/set-target',
  RESET_VISUAL: 'visual/reset',
  SET_MOTION: 'motion/set',
  SET_FLASH_GUARD: 'motion/flash-guard/set',
  ALLOW_FLASH_KEY: 'motion/flash-guard/allow',
  REMOVE_FLASH_KEY: 'motion/flash-guard/remove',
  SET_ANNOUNCE: 'ui/set-announce',
  SET_READER: 'reader/set',
  SET_FORMS: 'forms/set',
  APPLY_PATCH: 'settings/apply-patch',
  RESET_SCOPE: 'settings/reset-scope',
  ADD_USER_PROFILE: 'profile/add-user',
  REMOVE_USER_PROFILE: 'profile/remove-user',
  SET_META: 'meta/set',
  RESET_ALL: 'settings/reset-all',
});

function touch(settings) {
  return { ...settings, meta: { ...settings.meta, updatedAt: new Date().toISOString() } };
}

function allowlistWith(allowlist, key, shouldInclude) {
  const next = new Set(Array.isArray(allowlist) ? allowlist : []);
  if (shouldInclude) next.add(key);
  else next.delete(key);
  return Array.from(next);
}

/**
 * @param {ReturnType<typeof createDefaultSettings>} state
 * @param {{type: string, [key: string]: any}} action
 */
export function settingsReducer(state, action) {
  switch (action.type) {
    case SETTINGS_ACTIONS.HYDRATE: {
      const { settings } = sanitizeSettings(action.settings);
      return { ...settings, meta: { ...settings.meta, storageMode: action.storageMode || settings.meta.storageMode } };
    }

    case SETTINGS_ACTIONS.SET_VISUAL_ENABLED:
      return touch({ ...state, visual: { ...state.visual, enabled: action.enabled === true } });

    case SETTINGS_ACTIONS.SET_VISUAL_VALUES: {
      const visual = { ...state.visual };
      Object.keys(action.values || {}).forEach((key) => {
        if (key in VISUAL_DEFAULTS) visual[key] = clampVisualValue(key, action.values[key]);
      });
      // Moving a slider while the feature is switched off turns it on, so the
      // user always sees the effect of the control they just used.
      if (action.enable === true) visual.enabled = true;
      return touch({ ...state, visual });
    }

    case SETTINGS_ACTIONS.SET_VISUAL_TARGET:
      if (!VISUAL_TARGETS.includes(action.target)) return state;
      return touch({ ...state, visual: { ...state.visual, target: action.target } });

    case SETTINGS_ACTIONS.RESET_VISUAL:
      return touch({ ...state, visual: { ...state.visual, enabled: false, ...VISUAL_DEFAULTS } });

    case SETTINGS_ACTIONS.SET_MOTION: {
      const allowed = ['reduceMotion', 'pauseAnimations', 'motionStrategy', 'pauseAutoMedia'];
      if (!allowed.includes(action.key)) return state;
      let value = action.value;
      if (action.key === 'reduceMotion' && !REDUCE_MOTION_VALUES.includes(value)) return state;
      if (action.key === 'motionStrategy' && !MOTION_STRATEGIES.includes(value)) return state;
      if (action.key === 'pauseAnimations' || action.key === 'pauseAutoMedia') value = value === true;
      return touch({ ...state, motion: { ...state.motion, [action.key]: value } });
    }

    case SETTINGS_ACTIONS.SET_FLASH_GUARD: {
      const allowed = ['enabled', 'autoDetect', 'action'];
      if (!allowed.includes(action.key)) return state;
      const guard = { ...state.motion.flashGuard };
      if (action.key === 'action') {
        if (!FLASH_ACTIONS.includes(action.value)) return state;
        guard.action = action.value;
      } else {
        guard[action.key] = action.value === true;
      }
      return touch({ ...state, motion: { ...state.motion, flashGuard: guard } });
    }

    case SETTINGS_ACTIONS.ALLOW_FLASH_KEY:
      return touch({
        ...state,
        motion: {
          ...state.motion,
          flashGuard: {
            ...state.motion.flashGuard,
            allowlist: allowlistWith(state.motion.flashGuard.allowlist, action.key, true),
          },
        },
      });

    case SETTINGS_ACTIONS.REMOVE_FLASH_KEY:
      return touch({
        ...state,
        motion: {
          ...state.motion,
          flashGuard: {
            ...state.motion.flashGuard,
            allowlist: allowlistWith(state.motion.flashGuard.allowlist, action.key, false),
          },
        },
      });

    case SETTINGS_ACTIONS.SET_ANNOUNCE:
      return touch({ ...state, ui: { ...state.ui, announceOnChange: action.enabled === true } });

    case SETTINGS_ACTIONS.SET_READER: {
      const { key, value } = action;
      const reader = { ...state.reader };
      if (key === 'announceVerbosity') {
        if (!VERBOSITY_VALUES.includes(value)) return state;
        reader.announceVerbosity = value;
      } else if (READER_BOOLEAN_KEYS.includes(key)) {
        reader[key] = value === true;
      } else {
        return state;
      }
      return touch({ ...state, reader });
    }

    case SETTINGS_ACTIONS.SET_FORMS: {
      const { key, value } = action;
      if (!FORM_BOOLEAN_KEYS.includes(key)) return state;
      return touch({ ...state, forms: { ...state.forms, [key]: value === true } });
    }

    /**
     * Apply a validated patch in one step. Profiles and imported preference files
     * both go through here, so a profile can only change the keys it names and can
     * never reach the flashing-protection allowlist or an unknown group.
     */
    case SETTINGS_ACTIONS.APPLY_PATCH: {
      const patch = sanitizeSettingsPatch(action.patch);
      const merged = {
        ...state,
        visual: { ...state.visual, ...(patch.visual || {}) },
        motion: {
          ...state.motion,
          ...(patch.motion || {}),
          flashGuard: {
            ...state.motion.flashGuard,
            ...((patch.motion && patch.motion.flashGuard) || {}),
          },
        },
        reader: { ...state.reader, ...(patch.reader || {}) },
        forms: { ...state.forms, ...(patch.forms || {}) },
        ui: { ...state.ui, ...(patch.ui || {}) },
      };
      if (typeof action.profileId === 'string' && action.profileId) {
        merged.profile = {
          ...state.profile,
          id: action.profileId,
          appliedAt: new Date().toISOString(),
        };
      }
      return touch(merged);
    }

    /**
     * Reset one scope, or everything.
     *
     * Two things survive a reset on purpose:
     *  - saved profiles, because they are content the user created rather than a
     *    preference value, and deleting them silently would be destructive;
     *  - the flashing-protection allowlist, because it records decisions about
     *    specific elements on specific pages, not a global preference.
     * Both are documented in the reset panel, and the profiles can be deleted one by
     * one from the profiles panel.
     */
    case SETTINGS_ACTIONS.RESET_SCOPE: {
      const defaults = createDefaultSettings();
      const scope = RESET_SCOPES.includes(action.scope) ? action.scope : 'all';

      if (scope === 'all') {
        return {
          ...defaults,
          motion: {
            ...defaults.motion,
            flashGuard: {
              ...defaults.motion.flashGuard,
              allowlist: state.motion.flashGuard.allowlist,
            },
          },
          profile: { ...defaults.profile, user: state.profile.user },
          meta: {
            ...defaults.meta,
            storageMode: state.meta.storageMode,
            createdAt: state.meta.createdAt,
            updatedAt: new Date().toISOString(),
          },
        };
      }

      if (scope === 'motion') {
        return touch({
          ...state,
          motion: {
            ...defaults.motion,
            flashGuard: {
              ...defaults.motion.flashGuard,
              allowlist: state.motion.flashGuard.allowlist,
            },
          },
        });
      }

      return touch({ ...state, [scope]: defaults[scope] });
    }

    case SETTINGS_ACTIONS.ADD_USER_PROFILE: {
      const id = typeof action.id === 'string' ? action.id.trim().slice(0, 80) : '';
      const label =
        typeof action.label === 'string'
          ? action.label.trim().slice(0, PROFILE_LIMITS.MAX_LABEL_LENGTH)
          : '';
      const patch = sanitizeSettingsPatch(action.patch);
      if (!id || !label || Object.keys(patch).length === 0) return state;
      const user = sanitizeUserProfiles([...state.profile.user, { id, label, patch }]);
      const stored = user.find((entry) => entry.id === id);
      if (!stored) return state;
      return touch({
        ...state,
        profile: { ...state.profile, user, id, appliedAt: new Date().toISOString() },
      });
    }

    case SETTINGS_ACTIONS.REMOVE_USER_PROFILE: {
      const user = state.profile.user.filter((entry) => entry.id !== action.id);
      if (user.length === state.profile.user.length) return state;
      return touch({
        ...state,
        profile: {
          ...state.profile,
          user,
          // The values stay; nothing matches them any more, so the panel shows Custom.
          id: state.profile.id === action.id ? 'custom' : state.profile.id,
        },
      });
    }

    case SETTINGS_ACTIONS.SET_META:
      return { ...state, meta: { ...state.meta, ...action.patch } };

    case SETTINGS_ACTIONS.RESET_ALL: {
      const defaults = createDefaultSettings();
      return {
        ...defaults,
        motion: {
          ...defaults.motion,
          flashGuard: {
            ...defaults.motion.flashGuard,
            allowlist: state.motion.flashGuard.allowlist,
          },
        },
        profile: { ...defaults.profile, user: state.profile.user },
        meta: {
          ...defaults.meta,
          storageMode: state.meta.storageMode,
          createdAt: state.meta.createdAt,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    default:
      return state;
  }
}
