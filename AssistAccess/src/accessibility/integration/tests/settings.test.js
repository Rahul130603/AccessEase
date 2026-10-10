/**
 * Persistence and reset — Vitest.
 *
 * These cover the browser-dependent half of the settings pipeline that the pure
 * self-test (`integration/selfTest/settingsSelfTest.mjs`) cannot reach: the storage
 * adapters, the failure paths when a browser refuses to store anything, and the provider's
 * save/reset behaviour end to end.
 *
 * STATUS: authored, NOT executed in the review environment (no node_modules, no network).
 * Run with `npx vitest run` once the dev dependencies above are installed.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createStorage, readSettings, writeSettings, settingsKey } from '../../core/storage.js';
import { createDefaultSettings, sanitizeSettings } from '../../core/settingsSchema.js';
import { SETTINGS_ACTIONS, settingsReducer } from '../../core/settingsReducer.js';
import { createFailingStorage } from './vitest.setup.js';

describe('storage adapters', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('prefers localStorage and reports the mode', () => {
    const { adapter, mode, degraded } = createStorage('auto');
    expect(mode).toBe('local');
    expect(degraded).toBe(false);
    expect(adapter.write('probe', '1')).toBe(true);
  });

  it('degrades to memory when the browser refuses to store anything', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => createFailingStorage(),
    });

    const { mode, degraded } = createStorage('auto');
    expect(mode).toBe('memory');
    expect(degraded).toBe(true);

    if (original) Object.defineProperty(window, 'localStorage', original);
  });

  it('reports a failed write instead of throwing', () => {
    const adapter = {
      id: 'broken',
      read: () => null,
      write: () => false,
      remove: () => {},
    };
    expect(writeSettings(adapter, 'key', { a: 1 })).toBe(false);
  });

  it('returns ok:false for a corrupt stored payload', () => {
    const adapter = {
      id: 'stub',
      read: () => '{"broken":',
      write: () => true,
      remove: () => {},
    };
    const result = readSettings(adapter, settingsKey('assistaccess.a11y'));
    expect(result.ok).toBe(false);
    expect(sanitizeSettings(result.raw).settings.visual.brightness).toBe(100);
  });
});

describe('reset', () => {
  const defaults = createDefaultSettings();

  it('restores every group and keeps saved profiles', () => {
    let state = settingsReducer(defaults, {
      type: SETTINGS_ACTIONS.ADD_USER_PROFILE,
      id: 'user:mine:1',
      label: 'Mine',
      patch: { visual: { enabled: true, contrast: 120 } },
    });
    state = settingsReducer(state, {
      type: SETTINGS_ACTIONS.SET_VISUAL_VALUES,
      values: { brightness: 140 },
      enable: true,
    });

    const reset = settingsReducer(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
    expect(reset.visual).toEqual(defaults.visual);
    expect(reset.motion.reduceMotion).toBe('system');
    expect(reset.profile.user).toHaveLength(1);
  });

  it('resets one scope only', () => {
    let state = settingsReducer(defaults, {
      type: SETTINGS_ACTIONS.APPLY_PATCH,
      patch: { visual: { enabled: true, contrast: 140 }, motion: { pauseAnimations: true } },
    });
    state = settingsReducer(state, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'visual' });
    expect(state.visual).toEqual(defaults.visual);
    expect(state.motion.pauseAnimations).toBe(true);
  });

  it('can be undone in one step', () => {
    const before = settingsReducer(defaults, {
      type: SETTINGS_ACTIONS.APPLY_PATCH,
      patch: { visual: { enabled: true, contrast: 140 } },
      profileId: 'enhancedContrast',
    });
    const afterReset = settingsReducer(before, { type: SETTINGS_ACTIONS.RESET_SCOPE, scope: 'all' });
    const undone = settingsReducer(afterReset, {
      type: SETTINGS_ACTIONS.APPLY_PATCH,
      patch: { visual: before.visual, motion: before.motion },
      profileId: before.profile.id,
    });
    expect(undone.visual).toEqual(before.visual);
    expect(undone.profile.id).toBe('enhancedContrast');
  });
});

describe('settings validation', () => {
  it('clamps values loaded from storage', () => {
    const { settings } = sanitizeSettings({ visual: { brightness: 999, saturation: -40 } });
    expect(settings.visual.brightness).toBe(150);
    expect(settings.visual.saturation).toBe(0);
  });

  it('never lets a patch touch the flashing allowlist', () => {
    const state = {
      ...createDefaultSettings(),
      motion: { ...createDefaultSettings().motion, flashGuard: { enabled: true, autoDetect: true, action: 'pause', allowlist: ['keep'] } },
    };
    const next = settingsReducer(state, {
      type: SETTINGS_ACTIONS.APPLY_PATCH,
      patch: { motion: { flashGuard: { allowlist: ['replace'] } } },
    });
    expect(next.motion.flashGuard.allowlist).toEqual(['keep']);
  });
});
