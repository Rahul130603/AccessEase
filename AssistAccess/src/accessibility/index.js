/**
 * Public entry point for the accessibility module.
 *
 * This is the only file the rest of the team needs to import. Everything else is
 * an implementation detail and may change between minor versions; the exports
 * below are the integration contract.
 *
 *   import AccessibilityModule, { useA11ySettings, SafeAnimatedContent } from './accessibility';
 */

import AccessibilityModule, { AccessibilityProvider } from './AccessibilityModule.jsx';

export { AccessibilityModule, AccessibilityProvider };
export default AccessibilityModule;

// ── Widget UI (the floating launcher and the panel) ─────────────────────────
export { default as AccessibilityLauncher } from './AccessibilityLauncher.jsx';
export { default as AccessibilityPanel } from './AccessibilityPanel.jsx';
export { default as AccessibilitySettings } from './AccessibilitySettings.jsx';
export { default as AccessibilityAudit } from './AccessibilityAudit.jsx';
export { default as Icon } from './ui/icons.jsx';
export { ICON_PATHS, ICON_NAMES, getIconPaths } from './ui/iconPaths.js';
export { FEATURE_CATEGORIES, FEATURE_META, groupFeaturesByCategory, getFeatureCategory } from './features/categories.js';
export { WIDGET_STYLES } from './ui/styles/widget.js';

// ── Mounting (non-React hosts) ───────────────────────────────────────────────
export { mountAccessibilityToolbar } from './integration/mount.jsx';

// ── Feature metadata for the main toolbar ───────────────────────────────────
export { a11yFeatures, getA11yFeature } from './features/registry.js';

// ── Configuration and constants ─────────────────────────────────────────────
export { defaultConfig, normalizeConfig, isFeatureEnabled, VISUAL_TARGETS, CORNERS } from './config.js';
export { A11Y_API_VERSION, EVENTS, FEATURE_IDS, FEATURE_GROUPS, FLASH_LIMITS, STYLE_IDS, DATA_ATTRS, ANNOUNCEMENT_LEVELS, AUDIT_LIMITS, RESET_SCOPES, RESET_UNDO_WINDOW_MS, PROFILE_LIMITS } from './constants.js';

// ── Shared settings API ────────────────────────────────────────────────────
export {
  useA11ySettings,
  useA11ySettingsContext,
  useA11ySetting,
  useEffectiveReducedMotion,
  useAnnounce,
} from './core/SettingsContext.jsx';
export { createDefaultSettings, VISUAL_RANGES, VISUAL_DEFAULTS, VERBOSITY_VALUES } from './core/settingsSchema.js';
export { FORM_BOOLEAN_KEYS } from './core/settingsSchema.js';

// ── Announcements and motion preference ────────────────────────────────────
export { announce, getAnnouncementLog, subscribeAnnouncements, clearAnnouncementLog } from './core/a11y/announcer.js';
export { createRouteAnnouncer } from './core/a11y/routeAnnouncer.js';
export {
  prefersReducedMotion,
  subscribeReducedMotion,
  useReducedMotion,
  REDUCED_MOTION_QUERY,
} from './core/a11y/reducedMotion.js';
export { useForcedColors, usePrefersContrast, useMediaQuery } from './core/a11y/mediaQueries.js';

// ── Event bridge for non-React integration ─────────────────────────────────
export { emit as emitA11yEvent, subscribe as subscribeToA11yEvents } from './integration/events.js';

// ── Safe design pattern for app-owned animated content ─────────────────────
export { default as SafeAnimatedContent } from './patterns/SafeAnimatedContent.jsx';
export {
  SAFE_MOTION,
  isSafeFlashRate,
  cycleDurationForRate,
  checkAnimationSafety,
  warnIfUnsafe,
} from './patterns/safeMotion.js';

// ── Page audit (screen reader compatibility, alt text, labels, structure) ──
export { AuditProvider, useAudit } from './core/audit/AuditContext.jsx';
export { AUDIT_CHECKS, getAuditCheck } from './core/audit/checks/index.js';
export { buildReportText } from './core/audit/reportText.js';
export { FIX_EXAMPLES, getFixExample } from './core/audit/fixExamples.js';
export { SEVERITIES, CERTAINTY, summarizeFindings } from './core/audit/findings.js';
export { getAccessibleName, visibleText, describeNameSource } from './core/dom/accessibilityName.js';
export { subscribeToDomChanges } from './core/dom/domRegistry.js';

// ── Status announcements ───────────────────────────────────────────────────
export { default as StatusMessage } from './ui/StatusMessage.jsx';
export { default as LiveAnnouncement } from './ui/LiveAnnouncement.jsx';

// ── App-owned pattern components (markup the app renders itself) ───────────
export {
  default as Field,
  FieldError,
  FieldHint,
  useField,
  useFieldErrorAnnouncement,
} from './patterns/FormField.jsx';
export {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioGroupField,
} from './patterns/fields.jsx';
export { AccessibleImage, Figure } from './patterns/AccessibleImage.jsx';
export { SkipLink, Main, Section } from './patterns/PageStructure.jsx';

// ── Error messages ─────────────────────────────────────────────────────────
export { default as FormErrorSummary, useFormErrors } from './patterns/FormErrorSummary.jsx';

// ── Passwords and authentication ───────────────────────────────────────────
export { default as PasswordField } from './patterns/PasswordField.jsx';
export {
  SignInForm,
  RegistrationForm,
  PasswordResetForm,
  OneTimeCodeStep,
  authFormLabels,
} from './patterns/AuthForms.jsx';

// ── Confirmation before important actions ──────────────────────────────────
export { ConfirmProvider, useConfirm } from './core/confirm/ConfirmContext.jsx';
export { default as ConfirmButton } from './ui/ConfirmButton.jsx';
export { default as ConfirmDialog } from './ui/ConfirmDialog.jsx';
export { default as ReviewAndConfirm } from './patterns/ReviewAndConfirm.jsx';

// ── Preferences, reset and profiles ────────────────────────────────────────
export {
  BUILT_IN_PROFILES,
  CUSTOM_PROFILE_ID,
  DEFAULT_PROFILE_ID,
  buildUserProfilePatch,
  countPatchChanges,
  createUserProfileId,
  findProfile,
  getProfiles,
  matchesProfilePatch,
  resolveActiveProfile,
} from './core/profiles/profiles.js';
export {
  EXPORT_FORMAT,
  EXPORT_NOTE,
  buildExportPayload,
  defaultExportFilename,
  downloadJson,
  parseImportPayload,
  readFileText,
  serializeExport,
} from './core/preferencesIO.js';
export {
  PATCHABLE_GROUPS,
  createDefaultSettings as createDefaultSettingsSnapshot,
  sanitizeSettingsPatch,
  sanitizeUserProfiles,
  snapshotSettingsPatch,
} from './core/settingsSchema.js';

// ── Reusable UI primitives (so teammates' features match the toolbar) ──────
export { default as Switch } from './ui/Switch.jsx';
export { default as SliderControl } from './ui/SliderControl.jsx';
export { default as Panel } from './ui/Panel.jsx';
export { default as Disclosure } from './ui/Disclosure.jsx';
export { default as ToolbarLauncher } from './ui/ToolbarLauncher.jsx';
export { default as VisuallyHidden } from './ui/VisuallyHidden.jsx';

// ── Copy helpers ───────────────────────────────────────────────────────────
export { defaultStrings, createStrings, formatMessage } from './strings.js';
