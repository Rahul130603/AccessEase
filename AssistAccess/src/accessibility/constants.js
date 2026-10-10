/**
 * AssistAccess accessibility module — shared constants.
 *
 * Everything this module touches inside the host document is namespaced with the
 * values below. Nothing here may be renamed without bumping A11Y_API_VERSION:
 * teammates and persisted user settings depend on these strings.
 */

/** Public API version of the module (additive changes keep the major number). */
export const A11Y_API_VERSION = '0.2.0';

/** Prefix used for CSS custom properties, class names and data attributes. */
export const CSS_PREFIX = 'a11ytb';

/** Storage key namespace. Kept separate from the host app's own storage keys. */
export const STORAGE_NAMESPACE = 'assistaccess.a11y';

/** Bump when the persisted settings shape changes in a way that needs migration. */
export const SETTINGS_SCHEMA_VERSION = 1;

/** Feature identifiers (used by the feature registry and by config.features). */
export const FEATURE_IDS = Object.freeze({
  FLASHING: 'flashing',
  VISUALS: 'visuals',
  SCREEN_READER: 'screen-reader',
  ALT_TEXT: 'alt-text',
  FORM_LABELS: 'form-labels',
  HEADINGS: 'headings',
  ANNOUNCEMENTS: 'announcements',
  ERROR_MESSAGES: 'error-messages',
  PASSWORD: 'password',
  AUTH: 'auth',
  CONFIRM: 'confirm',
  PREFERENCES: 'preferences',
  RESET: 'reset',
  PROFILES: 'profiles',
});

export const FEATURE_GROUPS = Object.freeze({
  MOTION: 'motion',
  VISUAL: 'visual',
  READER: 'reader',
  FORMS: 'forms',
  AUTH: 'auth',
  PERSONALIZATION: 'personalization',
});

/** window CustomEvents emitted by the module (non-React integration bridge). */
export const EVENTS = Object.freeze({
  READY: 'a11ytb:ready',
  SETTINGS_CHANGED: 'a11ytb:settings-changed',
  PANEL_OPENED: 'a11ytb:panel-opened',
  PANEL_CLOSED: 'a11ytb:panel-closed',
  ANNOUNCE: 'a11ytb:announce',
  POST_ANNOUNCEMENT: 'a11ytb:announce-request',
  FINDING: 'a11ytb:finding',
  AUDIT_UPDATED: 'a11ytb:audit-updated',
  ANNOUNCEMENT: 'a11ytb:announcement',
  PROFILE_CHANGED: 'a11ytb:profile-changed',
  SETTINGS_RESET: 'a11ytb:reset',
  SETTINGS_SAVED: 'a11ytb:settings-saved',
  SETTINGS_IMPORTED: 'a11ytb:settings-imported',
  PANEL_OPEN_REQUEST: 'a11ytb:panel-open-request',
  PANEL_CLOSE_REQUEST: 'a11ytb:panel-close-request',
});

/**
 * One <style> element per concern ("one writer per global side effect").
 * The ids are stable so that teardown can be verified and so that a teammate can
 * inspect exactly what the toolbar injected.
 */
export const STYLE_IDS = Object.freeze({
  MOTION: 'a11ytb-motion-overrides',
  FLASH_GUARD: 'a11ytb-flash-guard',
  SAFE_PATTERN: 'a11ytb-safe-motion-pattern',
  AUDIT_HIGHLIGHT: 'a11ytb-audit-highlight',
  FORM_PATTERN: 'a11ytb-form-pattern',
  STRUCTURE_PATTERN: 'a11ytb-structure-pattern',
  CONFIRM_PATTERN: 'a11ytb-confirm-pattern',
});

/** Light-DOM live regions used by the announcer. */
export const LIVE_REGION_IDS = Object.freeze({
  POLITE: 'a11ytb-live-polite',
  ASSERTIVE: 'a11ytb-live-assertive',
});

/** data-* attributes this module may add to page elements. */
export const DATA_ATTRS = Object.freeze({
  /** Marks the element whose filter is currently controlled (html or content root). */
  VISUALS: 'data-a11ytb-visuals',
  /** Marks the element the motion override stylesheet is scoped to. */
  MOTION_SCOPE: 'data-a11ytb-motion-scope',
  /** Marks an element the flash guard has hidden. */
  FLASH_HIDDEN: 'data-a11ytb-flash-hidden',
  /** Marks an element the flash guard has paused. */
  FLASH_PAUSED: 'data-a11ytb-flash-paused',
  /** Marks audio/video the motion applier paused. */
  MEDIA_PAUSED: 'data-a11ytb-media-paused',
  /** Opt-out marker: the toolbar's scanners ignore subtrees carrying it. */
  EXCLUDE: 'data-a11ytb-exclude',
  /** Temporary marker used by the audit's "show me where" highlight. */
  AUDIT_HIGHLIGHT: 'data-a11ytb-audit-highlight',
  /** Set on the toolbar's own shadow host so scanners can always identify it. */
  HOST: 'data-a11ytb-host',
});

/**
 * Announcement levels, used by the verbosity setting.
 *  critical — errors and protective actions; always announced
 *  standard — state changes the user caused; the default
 *  verbose  — progress and scan details; suppressed by "minimal" and "standard"
 */
export const ANNOUNCEMENT_LEVELS = Object.freeze(['critical', 'standard', 'verbose']);

/** Budgets for the page audit. Keeps the scan cheap on very large pages. */
export const AUDIT_LIMITS = Object.freeze({
  /** Maximum elements inspected per check. */
  MAX_NODES_PER_CHECK: 3000,
  /** Maximum findings reported per check (the rest is reported as a count). */
  MAX_FINDINGS_PER_CHECK: 40,
  /** How long the "show me where" highlight stays on the element (ms). */
  HIGHLIGHT_MS: 4000,
});

/** Reset scopes offered by the reset feature. */
export const RESET_SCOPES = Object.freeze(['all', 'visual', 'motion', 'reader', 'forms']);

/** How long the "undo" offer stays available after a reset (ms). */
export const RESET_UNDO_WINDOW_MS = 15000;

/** Limits for user-defined profiles and imported preference files. */
export const PROFILE_LIMITS = Object.freeze({
  MAX_USER_PROFILES: 20,
  MAX_LABEL_LENGTH: 60,
  MAX_IMPORT_BYTES: 200000,
});

/**
 * Flash estimation limits.
 * The 3 flashes/second figure and the "small safe area" come from WCAG 2.3.1
 * (Three Flashes or Below Threshold). They are used here as *estimates* for a
 * best-effort guard — never as a conformance claim.
 */
export const FLASH_LIMITS = Object.freeze({
  /** WCAG 2.3.1: no more than three flashes in any one second period. */
  MAX_FLASHES_PER_SECOND: 3,
  /** Practical approximation of the WCAG small safe area (~0.006 steradians). */
  SAFE_AREA_PX: 21824,
  /** Share of the viewport that counts as a "large" flashing region. */
  LARGE_AREA_VIEWPORT_RATIO: 0.25,
  /** Minimum estimated luminance change worth reporting (0–1). */
  MIN_LUMINANCE_DELTA: 0.1,
  /** How often the guard re-checks the page while it is enabled (ms). */
  RESCAN_INTERVAL_MS: 2500,
});
