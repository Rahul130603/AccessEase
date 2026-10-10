/**
 * Export and import of accessibility preferences.
 *
 * Why this exists: localStorage is per browser and per device. Exporting is the only
 * honest answer to "I set this up on my desktop, now I am on a shared laptop", and it
 * is also the escape hatch when storage is disabled or gets cleared.
 *
 * What a file contains
 * --------------------
 * The patchable settings groups (visual, motion, reader, forms, ui), the user's saved
 * profiles, and which profile was active. Nothing else:
 *  - no page content, no URLs beyond nothing at all,
 *  - no form values, no passwords, no one-time codes, no tokens, no session data,
 *  - not the flashing-protection allowlist, because it names elements on pages the
 *    other device may not even have.
 *
 * Import is treated as untrusted input: size-limited, JSON-parsed defensively, run
 * through the same migration and clamping as stored settings, and reduced to a patch
 * so it cannot introduce a group or a key the module does not own.
 */

import { PROFILE_LIMITS, SETTINGS_SCHEMA_VERSION } from '../constants.js';
import { migrateSettings, sanitizeSettingsPatch, snapshotSettingsPatch } from './settingsSchema.js';

export const EXPORT_FORMAT = 'assistaccess.a11y.preferences';
export const EXPORT_VERSION = 1;

export const EXPORT_NOTE =
  'Accessibility preferences only. No page content, no passwords, no form values, no tokens.';

/**
 * Build the exported object (not yet serialised, so the panel can show it first).
 * @param {object} settings
 * @param {{apiVersion?: string}} [meta]
 */
export function buildExportPayload(settings, meta = {}) {
  const patch = snapshotSettingsPatch(settings);
  const user = (settings.profile && settings.profile.user) || [];
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    apiVersion: meta.apiVersion || null,
    exportedAt: new Date().toISOString(),
    note: EXPORT_NOTE,
    activeProfileId: (settings.profile && settings.profile.id) || 'default',
    settings: patch,
    profiles: user.map((profile) => ({
      id: profile.id,
      label: profile.label,
      patch: sanitizeSettingsPatch(profile.patch),
    })),
  };
}

export function serializeExport(payload) {
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate an imported payload.
 *
 * Accepts both the module's export format and a bare settings object (for hand-written
 * files and for payloads from earlier versions), reporting which one it found.
 *
 * @param {string} text
 * @returns {{ok: boolean, settings: object|null, profiles: Array, activeProfileId: string|null, warnings: string[], error: string|null}}
 */
export function parseImportPayload(text) {
  const result = {
    ok: false,
    settings: null,
    profiles: [],
    activeProfileId: null,
    warnings: [],
    error: null,
  };

  if (typeof text !== 'string' || text.trim() === '') {
    result.error = 'empty';
    return result;
  }
  if (text.length > PROFILE_LIMITS.MAX_IMPORT_BYTES) {
    result.error = 'too-large';
    return result;
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    result.error = 'invalid-json';
    return result;
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    result.error = 'not-an-object';
    return result;
  }

  const looksLikePackage = raw.format !== undefined || raw.settings !== undefined;
  if (looksLikePackage && raw.format && raw.format !== EXPORT_FORMAT) {
    result.warnings.push('unknown-format');
  }

  const source = looksLikePackage ? raw.settings : raw;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    result.error = 'no-settings';
    return result;
  }
  if (!looksLikePackage) result.warnings.push('bare-settings-object');

  const { settings, warnings } = migrateSettings(source);
  result.warnings.push(...warnings);
  result.settings = settings;

  if (Array.isArray(raw.profiles)) result.profiles = raw.profiles;
  if (typeof raw.activeProfileId === 'string' && raw.activeProfileId) {
    result.activeProfileId = raw.activeProfileId;
  }

  const patch = sanitizeSettingsPatch(settings);
  if (Object.keys(patch).length === 0) {
    result.warnings.push('nothing-to-apply');
  }

  result.ok = true;
  return result;
}

/** Suggested file name, so two exports on the same day do not overwrite each other silently. */
export function defaultExportFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `assistaccess-preferences-${stamp}.json`;
}

/**
 * Trigger a download. Returns false instead of throwing when the browser blocks it,
 * so the caller can tell the user and show the text for manual copying.
 */
export function downloadJson(filename, text) {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return false;
  }
  try {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    (document.body || document.documentElement).appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch (error) {
    return false;
  }
}

/** Read an imported file as text, with the same size limit as the parser. */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('no-file'));
      return;
    }
    if (typeof file.size === 'number' && file.size > PROFILE_LIMITS.MAX_IMPORT_BYTES) {
      reject(new Error('too-large'));
      return;
    }
    if (typeof FileReader === 'undefined') {
      reject(new Error('unsupported'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsText(file);
  });
}
