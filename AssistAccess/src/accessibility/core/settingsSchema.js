/**
 * Canonical settings shape for the shared accessibility settings API.
 *
 * Rules:
 *  - This file is the single source of truth for defaults, ranges and clamping.
 *  - The reducer stays pure; every value that enters the store passes through
 *    `sanitizeSettings`, so a hand-edited localStorage entry cannot produce an
 *    out-of-range filter or an unknown enum.
 *  - Unknown top-level groups are preserved verbatim. Later phases (and other
 *    teammates' modules) can add groups without an older version of this file
 *    destroying them on load.
 */

import { PROFILE_LIMITS, SETTINGS_SCHEMA_VERSION } from '../constants.js';

/** Numeric ranges. `default` doubles as the neutral value for the filter. */
export const VISUAL_RANGES = Object.freeze({
  brightness: Object.freeze({ min: 50, max: 150, step: 5, default: 100, unit: '%' }),
  contrast: Object.freeze({ min: 50, max: 150, step: 5, default: 100, unit: '%' }),
  saturation: Object.freeze({ min: 0, max: 200, step: 5, default: 100, unit: '%' }),
});

export const VISUAL_DEFAULTS = Object.freeze({
  brightness: VISUAL_RANGES.brightness.default,
  contrast: VISUAL_RANGES.contrast.default,
  saturation: VISUAL_RANGES.saturation.default,
});

export const VISUAL_TARGETS = Object.freeze(['document', 'contentRoot']);

/** 'system' follows the operating system's prefers-reduced-motion setting. */
export const REDUCE_MOTION_VALUES = Object.freeze(['system', 'on', 'off']);

/** instant = finish animations at once; pause = hold the current frame. */
export const MOTION_STRATEGIES = Object.freeze(['instant', 'pause']);

/** What the flash guard does when it suspects hazardous flashing. */
export const FLASH_ACTIONS = Object.freeze(['pause', 'hide', 'warn']);

/** How much the toolbar announces through the live regions. */
export const VERBOSITY_VALUES = Object.freeze(['minimal', 'standard', 'verbose']);

/** Settings keys the reader/audit group accepts. */
export const READER_BOOLEAN_KEYS = Object.freeze([
  'auditEnabled',
  'announceRouteChanges',
  'highlightOnJump',
]);

/** Settings keys the forms group accepts. */
export const FORM_BOOLEAN_KEYS = Object.freeze(['passwordToggle', 'announceErrors']);

/**
 * Groups a settings *patch* may touch. Used by profiles and by preference import:
 * a patch can only change the keys named here, they are clamped exactly like
 * stored settings, and `motion.flashGuard.allowlist` is deliberately not among
 * them — that list records decisions the user made about specific elements on a
 * page, and no profile or imported file may overwrite it.
 */
export const PATCHABLE_GROUPS = Object.freeze(['visual', 'motion', 'reader', 'forms', 'ui']);

export function createDefaultSettings() {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    visual: {
      enabled: false,
      brightness: VISUAL_DEFAULTS.brightness,
      contrast: VISUAL_DEFAULTS.contrast,
      saturation: VISUAL_DEFAULTS.saturation,
      target: 'document',
    },
    motion: {
      reduceMotion: 'system',
      pauseAnimations: false,
      motionStrategy: 'instant',
      pauseAutoMedia: false,
      flashGuard: {
        enabled: false,
        autoDetect: true,
        action: 'pause',
        /** Stable element keys the user has allowed on this page. */
        allowlist: [],
      },
    },
    ui: {
      announceOnChange: true,
    },
    /**
     * Reader group: page audit plus screen-reader announcement behaviour.
     * Added by the screen-reader phase; kept additive so earlier phases keep
     * working and unknown groups from other phases survive a load.
     */
    reader: {
      /** Run the read-only page audit while the toolbar is mounted. */
      auditEnabled: true,
      /** minimal | standard | verbose — see ANNOUNCEMENT_LEVELS. */
      announceVerbosity: 'standard',
      /** Announce SPA route/title changes (the app may already do this). */
      announceRouteChanges: true,
      /** Briefly outline the element a finding points at. Never changes semantics. */
      highlightOnJump: true,
    },
    /**
     * Forms group: defaults for the module's form components.
     *
     * These settings contain preferences only. No password, token, one-time code or
     * any other value entered into a field is ever written here — see
     * patterns/PasswordField.jsx and INTEGRATION-FORMS.md.
     */
    forms: {
      /** Render a show/hide control on password fields built with the module. */
      passwordToggle: true,
      /**
       * Announce field errors through the shared service as well as showing them.
       * Off by default: focusing the field (or the error summary) already reads the
       * message, and announcing it too makes a screen reader say it twice.
       */
      announceErrors: false,
    },
    /**
     * Personalization group: which profile was applied last, and the profiles the
     * user saved. The *displayed* profile is derived on every render (see
     * core/profiles/profiles.js): when the settings no longer match the patch the
     * recorded profile applied, the panel shows "Custom" instead. Nothing here
     * stores form values — see the notes on the group above.
     */
    profile: {
      /** Last applied profile id: built-in, configured, user-defined, or 'custom'. */
      id: 'default',
      appliedAt: null,
      /** [{ id, label, patch }] — patches are clamped through sanitizeSettingsPatch. */
      user: [],
    },
    meta: {
      createdAt: null,
      updatedAt: null,
      storageMode: 'memory',
    },
  };
}

function clampNumber(value, spec, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(spec.max, Math.max(spec.min, Math.round(numeric)));
}

/** Clamp a single visual value. Exported for the panel and the reducer. */
export function clampVisualValue(key, value) {
  const spec = VISUAL_RANGES[key];
  if (!spec) return VISUAL_DEFAULTS[key];
  return clampNumber(value, spec, spec.default);
}

function pickEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.length > 0).slice(0, 500);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Coerce persisted (or externally supplied) settings into a valid shape.
 * @param {unknown} raw
 * @returns {{ settings: ReturnType<typeof createDefaultSettings>, warnings: string[] }}
 */
export function sanitizeSettings(raw) {
  const defaults = createDefaultSettings();
  const warnings = [];
  if (!isPlainObject(raw)) {
    if (raw !== undefined && raw !== null) warnings.push('settings payload was not an object');
    return { settings: defaults, warnings };
  }

  const settings = defaults;

  if (isPlainObject(raw.visual)) {
    settings.visual.enabled = raw.visual.enabled === true;
    Object.keys(VISUAL_RANGES).forEach((key) => {
      const clamped = clampVisualValue(key, raw.visual[key]);
      if (raw.visual[key] !== undefined && raw.visual[key] !== clamped) {
        warnings.push(`visual.${key} was out of range and has been clamped`);
      }
      settings.visual[key] = clamped;
    });
    settings.visual.target = pickEnum(raw.visual.target, VISUAL_TARGETS, defaults.visual.target);
  }

  if (isPlainObject(raw.motion)) {
    settings.motion.reduceMotion = pickEnum(
      raw.motion.reduceMotion,
      REDUCE_MOTION_VALUES,
      defaults.motion.reduceMotion,
    );
    settings.motion.pauseAnimations = raw.motion.pauseAnimations === true;
    settings.motion.motionStrategy = pickEnum(
      raw.motion.motionStrategy,
      MOTION_STRATEGIES,
      defaults.motion.motionStrategy,
    );
    settings.motion.pauseAutoMedia = raw.motion.pauseAutoMedia === true;

    if (isPlainObject(raw.motion.flashGuard)) {
      settings.motion.flashGuard.enabled = raw.motion.flashGuard.enabled !== false;
      settings.motion.flashGuard.autoDetect = raw.motion.flashGuard.autoDetect !== false;
      settings.motion.flashGuard.action = pickEnum(
        raw.motion.flashGuard.action,
        FLASH_ACTIONS,
        defaults.motion.flashGuard.action,
      );
      settings.motion.flashGuard.allowlist = sanitizeStringArray(raw.motion.flashGuard.allowlist);
    }
  }

  if (isPlainObject(raw.ui)) {
    settings.ui.announceOnChange = raw.ui.announceOnChange !== false;
  }

  if (isPlainObject(raw.reader)) {
    settings.reader.auditEnabled = raw.reader.auditEnabled !== false;
    settings.reader.announceRouteChanges = raw.reader.announceRouteChanges !== false;
    settings.reader.highlightOnJump = raw.reader.highlightOnJump !== false;
    settings.reader.announceVerbosity = pickEnum(
      raw.reader.announceVerbosity,
      VERBOSITY_VALUES,
      defaults.reader.announceVerbosity,
    );
  }

  if (isPlainObject(raw.forms)) {
    settings.forms.passwordToggle = raw.forms.passwordToggle !== false;
    settings.forms.announceErrors = raw.forms.announceErrors === true;
  }

  if (isPlainObject(raw.profile)) {
    const id = typeof raw.profile.id === 'string' ? raw.profile.id.trim().slice(0, 80) : '';
    settings.profile.id = id || defaults.profile.id;
    settings.profile.appliedAt =
      typeof raw.profile.appliedAt === 'string' ? raw.profile.appliedAt : null;
    settings.profile.user = sanitizeUserProfiles(raw.profile.user);
  }

  if (isPlainObject(raw.meta)) {
    settings.meta.createdAt = typeof raw.meta.createdAt === 'string' ? raw.meta.createdAt : null;
    settings.meta.updatedAt = typeof raw.meta.updatedAt === 'string' ? raw.meta.updatedAt : null;
    settings.meta.storageMode = typeof raw.meta.storageMode === 'string' ? raw.meta.storageMode : 'memory';
  }

  // Preserve groups owned by other phases of the shared settings API.
  const known = new Set(Object.keys(defaults));
  Object.keys(raw).forEach((key) => {
    if (!known.has(key) && isPlainObject(raw[key])) settings[key] = raw[key];
  });

  return { settings, warnings };
}

/**
 * Migrate a persisted payload to the current schema version, then sanitize it.
 * Future versions add a case per step; each step must be pure.
 */
export function migrateSettings(raw) {
  if (!isPlainObject(raw)) return sanitizeSettings(raw);

  let payload = raw;
  const version = Number(payload.schemaVersion) || 0;

  // v0 → v1: pre-release payloads used a flat `filters` object and 'flashGuard'
  // at the top level. Fold them into the current shape.
  if (version < 1) {
    const legacyFilters = isPlainObject(payload.filters) ? payload.filters : null;
    const legacyGuard = isPlainObject(payload.flashGuard) ? payload.flashGuard : null;
    payload = {
      ...payload,
      schemaVersion: 1,
      visual: legacyFilters ? { ...payload.visual, ...legacyFilters } : payload.visual,
      motion: legacyGuard ? { ...payload.motion, flashGuard: legacyGuard } : payload.motion,
    };
  }

  const result = sanitizeSettings(payload);
  result.settings.schemaVersion = SETTINGS_SCHEMA_VERSION;
  return result;
}

/** Filter values as unitless multipliers for CSS filter functions. */
export function getFilterMultipliers(visual) {
  return {
    brightness: clampVisualValue('brightness', visual.brightness) / 100,
    contrast: clampVisualValue('contrast', visual.contrast) / 100,
    saturation: clampVisualValue('saturation', visual.saturation) / 100,
  };
}

/** True when the visual values are all neutral (nothing to apply). */
export function isVisualNeutral(visual) {
  const multipliers = getFilterMultipliers(visual);
  return (
    multipliers.brightness === 1 && multipliers.contrast === 1 && multipliers.saturation === 1
  );
}

/** Resolve the effective "reduce motion" flag from the setting plus the OS value. */
export function resolveReducedMotion(reduceMotion, osPrefersReduced) {
  if (reduceMotion === 'on') return true;
  if (reduceMotion === 'off') return false;
  return osPrefersReduced === true;
}

/**
 * Validate and clamp a settings patch (from a profile, an imported file, or a
 * configured profile). This is the single gate for every value a patch can carry:
 *
 *  - only the groups in PATCHABLE_GROUPS are read, so a patch cannot introduce a
 *    new group or reach into anything a teammate's module might own;
 *  - visual numbers are clamped to the same ranges as stored settings;
 *  - enums are checked against their allowed values;
 *  - `motion.flashGuard.allowlist` is never copied.
 *
 * @param {unknown} patch
 * @returns {object} a safe patch (possibly empty)
 */
export function sanitizeSettingsPatch(patch) {
  const out = {};
  if (!isPlainObject(patch)) return out;

  if (isPlainObject(patch.visual)) {
    const visual = {};
    Object.keys(VISUAL_RANGES).forEach((key) => {
      if (patch.visual[key] !== undefined) visual[key] = clampVisualValue(key, patch.visual[key]);
    });
    if (patch.visual.enabled !== undefined) visual.enabled = patch.visual.enabled === true;
    if (patch.visual.target !== undefined) {
      visual.target = pickEnum(patch.visual.target, VISUAL_TARGETS, 'document');
    }
    if (Object.keys(visual).length) out.visual = visual;
  }

  if (isPlainObject(patch.motion)) {
    const motion = {};
    if (patch.motion.reduceMotion !== undefined) {
      motion.reduceMotion = pickEnum(patch.motion.reduceMotion, REDUCE_MOTION_VALUES, 'system');
    }
    if (patch.motion.motionStrategy !== undefined) {
      motion.motionStrategy = pickEnum(patch.motion.motionStrategy, MOTION_STRATEGIES, 'instant');
    }
    if (patch.motion.pauseAnimations !== undefined) {
      motion.pauseAnimations = patch.motion.pauseAnimations === true;
    }
    if (patch.motion.pauseAutoMedia !== undefined) {
      motion.pauseAutoMedia = patch.motion.pauseAutoMedia === true;
    }
    if (isPlainObject(patch.motion.flashGuard)) {
      const guard = {};
      if (patch.motion.flashGuard.enabled !== undefined) {
        guard.enabled = patch.motion.flashGuard.enabled !== false;
      }
      if (patch.motion.flashGuard.autoDetect !== undefined) {
        guard.autoDetect = patch.motion.flashGuard.autoDetect !== false;
      }
      if (patch.motion.flashGuard.action !== undefined) {
        guard.action = pickEnum(patch.motion.flashGuard.action, FLASH_ACTIONS, 'pause');
      }
      // flashGuard.allowlist is intentionally ignored.
      if (Object.keys(guard).length) motion.flashGuard = guard;
    }
    if (Object.keys(motion).length) out.motion = motion;
  }

  if (isPlainObject(patch.reader)) {
    const reader = {};
    if (patch.reader.auditEnabled !== undefined) reader.auditEnabled = patch.reader.auditEnabled !== false;
    if (patch.reader.announceRouteChanges !== undefined) {
      reader.announceRouteChanges = patch.reader.announceRouteChanges !== false;
    }
    if (patch.reader.highlightOnJump !== undefined) {
      reader.highlightOnJump = patch.reader.highlightOnJump !== false;
    }
    if (patch.reader.announceVerbosity !== undefined) {
      reader.announceVerbosity = pickEnum(patch.reader.announceVerbosity, VERBOSITY_VALUES, 'standard');
    }
    if (Object.keys(reader).length) out.reader = reader;
  }

  if (isPlainObject(patch.forms)) {
    const forms = {};
    FORM_BOOLEAN_KEYS.forEach((key) => {
      if (patch.forms[key] !== undefined) forms[key] = patch.forms[key] === true;
    });
    if (Object.keys(forms).length) out.forms = forms;
  }

  if (isPlainObject(patch.ui)) {
    const ui = {};
    if (patch.ui.announceOnChange !== undefined) {
      ui.announceOnChange = patch.ui.announceOnChange !== false;
    }
    if (Object.keys(ui).length) out.ui = ui;
  }

  return out;
}

/** Validate the user-defined profile list. */
export function sanitizeUserProfiles(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const profiles = [];
  list.slice(0, PROFILE_LIMITS.MAX_USER_PROFILES).forEach((entry) => {
    if (!isPlainObject(entry)) return;
    const id = typeof entry.id === 'string' ? entry.id.trim().slice(0, 80) : '';
    const label = typeof entry.label === 'string' ? entry.label.trim().slice(0, PROFILE_LIMITS.MAX_LABEL_LENGTH) : '';
    if (!id || !label || seen.has(id)) return;
    const patch = sanitizeSettingsPatch(entry.patch);
    if (Object.keys(patch).length === 0) return;
    seen.add(id);
    profiles.push({ id, label, patch });
  });
  return profiles;
}

/**
 * Snapshot the current settings as a patch (used when saving a user profile).
 * Only PATCHABLE_GROUPS are captured, and the flashing-protection allowlist is
 * left out: it belongs to the page it was made on.
 */
export function snapshotSettingsPatch(settings) {
  if (!isPlainObject(settings)) return {};
  return sanitizeSettingsPatch({
    visual: settings.visual,
    motion: settings.motion,
    reader: settings.reader,
    forms: settings.forms,
    ui: settings.ui,
  });
}
