/**
 * Settings self-test — persistence, reset and profiles.
 *
 * Runs with plain Node, no test framework and no dependencies:
 *
 *     node src/accessibility/integration/selfTest/settingsSelfTest.mjs
 *
 * It covers the parts of this phase that are pure logic: schema validation and
 * clamping, the reducer (apply patch, reset scopes, profile patches, undo), profile
 * matching and the Custom transition, and export/import validation — including the
 * guarantees the UI claims (no secrets in exports, the per-page flashing allowlist
 * cannot be changed by a profile or an import).
 *
 * What it deliberately does NOT cover: anything that needs a DOM or a browser
 * (localStorage adapters, React rendering, focus behaviour). Those are covered by the
 * manual cases in INTEGRATION-PREFERENCES.md.
 */

import { PROFILE_LIMITS } from '../../constants.js';
import { FEATURE_IDS } from '../../constants.js';
import { FEATURE_CATEGORIES, FEATURE_META } from '../../features/categories.js';
import { WIDGET_STYLES } from '../../ui/styles/widget.js';
import { ICON_PATHS } from '../../ui/iconPaths.js';
import { readFileSync } from 'node:fs';
import {
  buildExportPayload,
  parseImportPayload,
  serializeExport,
} from '../../core/preferencesIO.js';
import {
  BUILT_IN_PROFILES,
  buildUserProfilePatch,
  countPatchChanges,
  getProfiles,
  matchesProfilePatch,
  resolveActiveProfile,
} from '../../core/profiles/profiles.js';
import {
  createDefaultSettings,
  migrateSettings,
  sanitizeSettings,
  sanitizeSettingsPatch,
  sanitizeUserProfiles,
  snapshotSettingsPatch,
  VISUAL_RANGES,
} from '../../core/settingsSchema.js';
import { SETTINGS_ACTIONS, settingsReducer } from '../../core/settingsReducer.js';

// ── Tiny assertion harness ───────────────────────────────────────────────────
let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, message: error && error.message ? error.message : String(error) });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message || 'not equal'}: expected ${b}, got ${a}`);
}

function apply(state, action) {
  return settingsReducer(state, action);
}

function patchOf(profile, state) {
  return apply(state, {
    type: SETTINGS_ACTIONS.APPLY_PATCH,
    patch: profile.patch,
    profileId: profile.id,
  });
}

const defaults = createDefaultSettings();
const defaultProfile = BUILT_IN_PROFILES.find((profile) => profile.id === 'default');
const reducedMotion = BUILT_IN_PROFILES.find((profile) => profile.id === 'reducedMotion');
const lowStimulation = BUILT_IN_PROFILES.find((profile) => profile.id === 'lowStimulation');
const enhancedContrast = BUILT_IN_PROFILES.find((profile) => profile.id === 'enhancedContrast');

// ── Default configuration ────────────────────────────────────────────────────
test('defaults define every documented group', () => {
  ['visual', 'motion', 'reader', 'forms', 'ui', 'profile', 'meta'].forEach((group) => {
    assert(defaults[group] && typeof defaults[group] === 'object', `missing group ${group}`);
  });
  assertEqual(defaults.visual.brightness, 100, 'default brightness');
  assertEqual(defaults.visual.enabled, false, 'default visual enabled');
  assertEqual(defaults.motion.reduceMotion, 'system', 'default follows the OS');
  assertEqual(defaults.profile.id, 'default', 'default profile id');
  assertEqual(defaults.profile.user, [], 'no user profiles by default');
});

test('visual ranges are the documented bounds', () => {
  assertEqual([VISUAL_RANGES.brightness.min, VISUAL_RANGES.brightness.max], [50, 150]);
  assertEqual([VISUAL_RANGES.contrast.min, VISUAL_RANGES.contrast.max], [50, 150]);
  assertEqual([VISUAL_RANGES.saturation.min, VISUAL_RANGES.saturation.max], [0, 200]);
});

// ── Persistence: load safely, validate before applying ───────────────────────
test('stored values are clamped on load', () => {
  const { settings, warnings } = sanitizeSettings({
    visual: { brightness: 999, contrast: -20, saturation: 1000 },
    motion: { reduceMotion: 'sometimes' },
  });
  assertEqual(settings.visual.brightness, 150, 'brightness clamped up');
  assertEqual(settings.visual.contrast, 50, 'contrast clamped down');
  assertEqual(settings.visual.saturation, 200, 'saturation clamped');
  assertEqual(settings.motion.reduceMotion, 'system', 'unknown enum falls back');
  assert(warnings.length >= 1, 'clamping is reported');
});

test('unknown enums fall back instead of being applied', () => {
  const { settings } = sanitizeSettings({
    visual: { target: 'body' },
    motion: { motionStrategy: 'wobble', flashGuard: { action: 'explode' } },
    reader: { announceVerbosity: 'shout' },
  });
  assertEqual(settings.visual.target, 'document');
  assertEqual(settings.motion.motionStrategy, 'instant');
  assertEqual(settings.motion.flashGuard.action, 'pause');
  assertEqual(settings.reader.announceVerbosity, 'standard');
});

test('groups owned by other phases survive a load', () => {
  const { settings } = sanitizeSettings({
    visual: { brightness: 110 },
    teammateExperimental: { someKey: 'kept' },
  });
  assertEqual(settings.teammateExperimental, { someKey: 'kept' });
});

test('legacy payloads migrate', () => {
  const { settings } = migrateSettings({ filters: { brightness: 120 }, flashGuard: { action: 'warn' } });
  assertEqual(settings.visual.brightness, 120, 'legacy filters folded into visual');
  assertEqual(settings.motion.flashGuard.action, 'warn', 'legacy guard folded into motion');
  assertEqual(settings.schemaVersion, 1, 'schema version stamped');
});

test('a corrupt payload cannot poison the store', () => {
  const { settings } = sanitizeSettings('not an object');
  assertEqual(settings.visual.brightness, 100);
  const arrayPayload = sanitizeSettings([1, 2, 3]);
  assertEqual(arrayPayload.settings.motion.reduceMotion, 'system');
});

// ── Import / export ─────────────────────────────────────────────────────────
test('export contains only the documented keys and groups', () => {
  const payload = buildExportPayload(defaults, { apiVersion: '0.2.0' });
  assertEqual(
    Object.keys(payload).sort(),
    [
      'activeProfileId',
      'apiVersion',
      'exportedAt',
      'format',
      'note',
      'profiles',
      'schemaVersion',
      'settings',
      'version',
    ].sort(),
  );
  assertEqual(Object.keys(payload.settings).sort(), ['forms', 'motion', 'reader', 'ui', 'visual']);
});

test('export never contains secrets or the per-page allowlist', () => {
  const poisoned = {
    ...defaults,
    motion: {
      ...defaults.motion,
      flashGuard: { ...defaults.motion.flashGuard, allowlist: ['secret-element-key'] },
    },
    // Values that must never be serialised, even if some component put them on state.
    password: 'hunter2-correct-horse',
    oneTimeCode: '123456',
    token: 'bearer-abc123',
  };
  const text = serializeExport(buildExportPayload(poisoned));
  ['hunter2-correct-horse', '123456', 'bearer-abc123', 'secret-element-key'].forEach((secret) => {
    assert(!text.includes(secret), `export leaked ${secret}`);
  });
});

test('export and import round-trip', () => {
  const custom = apply(defaults, {
    type: SETTINGS_ACTIONS.APPLY_PATCH,
    patch: { visual: { enabled: true, contrast: 130 } },
    profileId: 'enhancedContrast',
  });
  const text = serializeExport(buildExportPayload(custom));
  const parsed = parseImportPayload(text);
  assert(parsed.ok, `import failed: ${parsed.error}`);
  assertEqual(parsed.settings.visual.contrast, 130, 'contrast survived the round trip');
  assertEqual(parsed.activeProfileId, 'enhancedContrast', 'active profile survived');
  assertEqual(snapshotSettingsPatch(parsed.settings), snapshotSettingsPatch(custom), 'patches match');
});

test('import rejects malformed input with a specific reason', () => {
  assertEqual(parseImportPayload('').error, 'empty');
  assertEqual(parseImportPayload('{oops').error, 'invalid-json');
  assertEqual(parseImportPayload('[1,2,3]').error, 'not-an-object');
  assertEqual(parseImportPayload('{"format":"x"}').error, 'no-settings');
  const huge = `{"settings":${JSON.stringify({ visual: { brightness: 100 } }).repeat(1)},"pad":"${'x'.repeat(PROFILE_LIMITS.MAX_IMPORT_BYTES + 1)}"}`;
  assertEqual(parseImportPayload(huge).error, 'too-large');
});

test('import clamps out-of-range values and flags a bare settings object', () => {
  const parsed = parseImportPayload('{"visual":{"brightness":9000,"contrast":10}}');
  assert(parsed.ok, 'bare settings object is accepted');
  assert(parsed.warnings.includes('bare-settings-object'), 'caller is told it was not an export file');
  const patch = sanitizeSettingsPatch(parsed.settings);
  assertEqual(patch.visual.brightness, 150);
  assertEqual(patch.visual.contrast, 50);
});

test('an imported patch cannot reach the per-page allowlist', () => {
  const state = {
    ...defaults,
    motion: { ...defaults.motion, flashGuard: { ...defaults.motion.flashGuard, allowlist: ['keep-me'] } },
  };
  const patch = sanitizeSettingsPatch({
    motion: { flashGuard: { allowlist: ['replace-with-mine'], action: 'hide' } },
  });
  assertEqual(patch.motion.flashGuard.allowlist, undefined, 'allowlist is not patchable');
  const next = apply(state, { type: SETTINGS_ACTIONS.APPLY_PATCH, patch });
  assertEqual(next.motion.flashGuard.allowlist, ['keep-me'], 'allowlist unchanged');
  assertEqual(next.motion.flashGuard.action, 'hide', 'the rest of the patch applied');
});

// ── Reset ───────────────────────────────────────────────────────────────────
test('reset everything returns the defaults', () => {
  let state = patchOf(enhancedContrast, defaults);
  state = apply(state, { type: SETTINGS_ACTIONS.SET_VISUAL_VALUES, values: { brightness: 140 } });
  state = apply(state, { type: SETTINGS_ACTIONS.SET_READER, key: 'announceVerbosity', value: 'verbose' });
  const reset = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
  assertEqual(reset.visual, defaults.visual, 'visual back to defaults');
  assertEqual(reset.motion, defaults.motion, 'motion back to defaults');
  assertEqual(reset.reader, defaults.reader, 'reader back to defaults');
  assertEqual(reset.profile.id, 'default', 'active profile back to default');
});

test('a scoped reset leaves the other groups alone', () => {
  let state = patchOf(lowStimulation, defaults);
  state = apply(state, { type: SETTINGS_ACTIONS.SET_READER, key: 'announceVerbosity', value: 'minimal' });
  const reset = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'visual' });
  assertEqual(reset.visual, defaults.visual, 'visual reset');
  assertEqual(reset.motion.pauseAnimations, true, 'motion untouched');
  assertEqual(reset.reader.announceVerbosity, 'minimal', 'reader untouched');
});

test('reset keeps saved profiles and the per-page allowlist', () => {
  let state = apply(defaults, {
    type: SETTINGS_ACTIONS.ADD_USER_PROFILE,
    id: 'user:mine:1',
    label: 'Mine',
    patch: buildUserProfilePatch(defaults),
  });
  state = apply(state, { type: SETTINGS_ACTIONS.APPLY_PATCH, patch: { motion: { pauseAnimations: true } } });
  state = {
    ...state,
    motion: { ...state.motion, flashGuard: { ...state.motion.flashGuard, allowlist: ['page-element'] } },
  };
  const reset = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
  assertEqual(reset.profile.user.length, 1, 'user profile kept');
  assertEqual(reset.motion.flashGuard.allowlist, ['page-element'], 'allowlist kept');
  assertEqual(reset.motion.pauseAnimations, false, 'motion preference reset');
});

test('undo restores the previous settings exactly', () => {
  const before = patchOf(lowStimulation, defaults);
  const snapshot = { patch: snapshotSettingsPatch(before), profileId: before.profile.id };
  const afterReset = apply(before, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
  assert(afterReset.visual.contrast !== before.visual.contrast, 'reset actually changed something');
  const restored = apply(afterReset, {
    type: SETTINGS_ACTIONS.APPLY_PATCH,
    patch: snapshot.patch,
    profileId: snapshot.profileId,
  });
  assertEqual(restored.visual, before.visual, 'visual restored');
  assertEqual(restored.motion, before.motion, 'motion restored');
  assertEqual(restored.profile.id, before.profile.id, 'profile restored');
});

test('the reducer is pure and does not mutate its input', () => {
  const state = patchOf(enhancedContrast, defaults);
  const copy = JSON.parse(JSON.stringify(state));
  const a = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
  const b = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
  assertEqual(JSON.parse(JSON.stringify(state)), copy, 'input state untouched');
  assertEqual(a.visual, b.visual, 'same input gives the same output');
});

// ── Profiles ────────────────────────────────────────────────────────────────
test('the four built-in profiles exist with distinct patches', () => {
  const ids = BUILT_IN_PROFILES.map((profile) => profile.id);
  assertEqual(ids, ['default', 'reducedMotion', 'lowStimulation', 'enhancedContrast']);
  assert(defaultProfile.patch.visual.enabled === false, 'Default has no visual adjustment');
  assertEqual(defaultProfile.patch.motion.reduceMotion, 'system', 'Default follows the OS');
  assertEqual(reducedMotion.patch.motion.reduceMotion, 'on', 'Reduced motion asks for less motion');
  assertEqual(reducedMotion.patch.visual, undefined, 'Reduced motion does not touch colours');
  assertEqual(enhancedContrast.patch.motion, undefined, 'Enhanced contrast does not touch motion');
  assertEqual(lowStimulation.patch.visual.saturation, 55, 'Low stimulation softens colours');
});

test('no built-in profile can force motion on against the system', () => {
  BUILT_IN_PROFILES.forEach((profile) => {
    const reduce = profile.patch.motion && profile.patch.motion.reduceMotion;
    assert(reduce !== 'off', `${profile.id} must not force motion on`);
  });
});

test('the default settings match the Default profile', () => {
  assert(matchesProfilePatch(defaults, defaultProfile.patch), 'defaults match Default');
  const active = resolveActiveProfile(defaults, getProfiles({ settings: defaults }));
  assertEqual(active.id, 'default');
  assertEqual(active.isCustom, false);
});

test('applying a profile uses the shared pipeline and reports the change count', () => {
  const changed = countPatchChanges(defaults, enhancedContrast.patch);
  assertEqual(changed, 2, 'enabled + contrast change');
  const next = patchOf(enhancedContrast, defaults);
  assertEqual(next.visual.contrast, 130);
  assertEqual(next.visual.enabled, true);
  assertEqual(next.profile.id, 'enhancedContrast');
  assert(Boolean(next.profile.appliedAt), 'application time recorded');
});

test('editing a profile value switches the displayed profile to Custom', () => {
  const profiles = getProfiles({ settings: defaults });
  let state = patchOf(enhancedContrast, defaults);
  assertEqual(resolveActiveProfile(state, profiles).id, 'enhancedContrast', 'profile active');
  state = apply(state, { type: SETTINGS_ACTIONS.SET_VISUAL_VALUES, values: { brightness: 110 } });
  const active = resolveActiveProfile(state, profiles);
  assertEqual(active.id, 'custom', 'displayed profile is Custom');
  assertEqual(active.isCustom, true);
  state = apply(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'visual' });
  assertEqual(resolveActiveProfile(state, profiles).id, 'custom', 'still custom after a reset');
});

test('changing a setting a profile does not mention keeps the profile active', () => {
  const profiles = getProfiles({ settings: defaults });
  const state = apply(patchOf(enhancedContrast, defaults), {
    type: SETTINGS_ACTIONS.SET_READER,
    key: 'announceVerbosity',
    value: 'verbose',
  });
  assertEqual(resolveActiveProfile(state, profiles).id, 'enhancedContrast');
});

test('a profile leaves the groups it does not name untouched', () => {
  const state = apply(defaults, {
    type: SETTINGS_ACTIONS.SET_READER,
    key: 'announceVerbosity',
    value: 'minimal',
  });
  const next = patchOf(reducedMotion, state);
  assertEqual(next.reader.announceVerbosity, 'minimal', 'reader untouched by a motion profile');
  assertEqual(next.visual, state.visual, 'visuals untouched by a motion profile');
});

test('configured profiles can extend or replace the built-ins', () => {
  const profiles = getProfiles({
    settings: defaults,
    config: {
      profiles: [
        { id: 'enhancedContrast', label: 'Our high contrast', patch: { visual: { enabled: true, contrast: 145 } } },
        { id: 'focus', label: 'Focus mode', patch: { reader: { announceVerbosity: 'minimal' } } },
      ],
    },
  });
  const replaced = profiles.find((profile) => profile.id === 'enhancedContrast');
  assertEqual(replaced.label, 'Our high contrast', 'built-in replaced by id');
  assertEqual(replaced.source, 'configured');
  assert(Boolean(profiles.find((profile) => profile.id === 'focus')), 'extra profile added');
});

test('user profiles are validated, capped and deletable', () => {
  const tooMany = Array.from({ length: PROFILE_LIMITS.MAX_USER_PROFILES + 5 }, (unused, index) => ({
    id: `user:${index}`,
    label: `Profile ${index}`,
    patch: { visual: { brightness: 100 + (index % 3) * 5 } },
  }));
  const sanitized = sanitizeUserProfiles(tooMany);
  assertEqual(sanitized.length, PROFILE_LIMITS.MAX_USER_PROFILES, 'list capped');

  const junk = sanitizeUserProfiles([
    null,
    { id: '', label: 'No id', patch: { visual: { brightness: 110 } } },
    { id: 'ok', label: '', patch: { visual: { brightness: 110 } } },
    { id: 'empty-patch', label: 'Nothing', patch: {} },
    { id: 'long', label: 'x'.repeat(200), patch: { visual: { brightness: 110 } } },
    { id: 'ok', label: 'Duplicate', patch: { visual: { brightness: 110 } } },
  ]);
  // Entries without an id, without a label or without a patch are dropped. The first
  // 'ok' entry is dropped for having no label, so the later 'ok' is not a duplicate.
  assertEqual(
    junk.map((entry) => entry.id),
    ['long', 'ok'],
    'only entries with an id, a label and a patch survive',
  );
  assertEqual(junk[0].label.length, PROFILE_LIMITS.MAX_LABEL_LENGTH, 'label truncated');

  let state = apply(defaults, {
    type: SETTINGS_ACTIONS.ADD_USER_PROFILE,
    id: 'user:mine:1',
    label: 'Mine',
    // Exactly what actions.addUserProfile() sends: a snapshot of the current settings.
    patch: buildUserProfilePatch(defaults),
  });
  assertEqual(state.profile.user.length, 1);
  assertEqual(state.profile.id, 'user:mine:1', 'new profile becomes active');
  // Saving a profile stores the current settings; it must not change them.
  assertEqual(state.visual.contrast, 100, 'saving a profile does not change settings');
  assertEqual(state.visual.enabled, false, 'saving a profile does not change settings');
  // A profile saved from the current settings always matches them, so it is active.
  assertEqual(
    resolveActiveProfile(state, getProfiles({ settings: state })).id,
    'user:mine:1',
    'the profile just saved is the active one',
  );
  const removed = apply(state, { type: SETTINGS_ACTIONS.REMOVE_USER_PROFILE, id: 'user:mine:1' });
  assertEqual(removed.profile.user.length, 0, 'profile deleted');
  assertEqual(removed.profile.id, 'custom', 'values stay, so the state is Custom');
  assertEqual(removed.visual.contrast, 100, 'settings are not touched by deleting a profile');
});

test('a snapshot patch captures settings but not the allowlist or profile list', () => {
  const state = apply(defaults, {
    type: SETTINGS_ACTIONS.SET_VISUAL_VALUES,
    values: { contrast: 120 },
    enable: true,
  });
  const patch = buildUserProfilePatch(state);
  assertEqual(Object.keys(patch).sort(), ['forms', 'motion', 'reader', 'ui', 'visual']);
  assertEqual(patch.motion.flashGuard.allowlist, undefined, 'allowlist not captured');
  assertEqual(patch.profile, undefined, 'profile list not captured');
  assertEqual(patch.visual.contrast, 120);
});

// ── Widget wiring ───────────────────────────────────────────────────────────
test('exactly the fourteen assigned features are declared', () => {
  const ids = Object.values(FEATURE_IDS);
  assertEqual(ids.length, 14, 'fourteen feature ids');
  const categorised = Object.keys(FEATURE_META);
  assertEqual(categorised.length, 14, 'fourteen features in the presentation table');
  ids.forEach((id) => assert(categorised.includes(id), `feature ${id} has no category or icon`));
  categorised.forEach((id) => assert(ids.includes(id), `${id} is not a declared feature id`));
});

test('every feature has a real category and a real icon', () => {
  const categoryIds = FEATURE_CATEGORIES.map((category) => category.id);
  assertEqual(categoryIds.length, 4, 'four categories');
  Object.keys(FEATURE_META).forEach((id) => {
    const meta = FEATURE_META[id];
    assert(categoryIds.includes(meta.category), `${id} points at unknown category ${meta.category}`);
    assert(Boolean(ICON_PATHS[meta.icon]), `${id} points at unknown icon ${meta.icon}`);
    assert(meta.icon !== undefined, `${id} has no icon`);
  });
  FEATURE_CATEGORIES.forEach((category) => {
    assert(Boolean(ICON_PATHS[category.icon]), `category ${category.id} has an unknown icon`);
    assert(
      Object.keys(FEATURE_META).some((id) => FEATURE_META[id].category === category.id),
      `category ${category.id} has no features`,
    );
  });
});

test('the widget stylesheet matches accessibility.css', () => {
  const fileCss = readFileSync(new URL('../../accessibility.css', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .trim();
  const runtimeCss = String(WIDGET_STYLES).replace(/\r\n/g, '\n').trim();
  if (fileCss !== runtimeCss) {
    const limit = Math.min(fileCss.length, runtimeCss.length);
    let index = 0;
    while (index < limit && fileCss[index] === runtimeCss[index]) index += 1;
    throw new Error(
      `stylesheet drift at character ${index}: accessibility.css has ${JSON.stringify(
        fileCss.slice(index, index + 60),
      )}, widget.js has ${JSON.stringify(runtimeCss.slice(index, index + 60))}`,
    );
  }
});

// ── Summary ─────────────────────────────────────────────────────────────────
const total = passed + failures.length;
if (failures.length === 0) {
  console.log(`settings self-test: ${passed}/${total} checks passed`);
  process.exit(0);
}

console.error(`settings self-test: ${failures.length} of ${total} checks FAILED\n`);
failures.forEach((failure) => {
  console.error(`  ✗ ${failure.name}\n    ${failure.message}`);
});
process.exit(1);
