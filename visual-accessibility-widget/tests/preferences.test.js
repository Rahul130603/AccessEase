import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, MIN_FONT_SCALE, normalizeSettings, createPreferenceStore } from '../src/engine/preferenceStore.js';

describe('preference validation and persistence', () => {
  it('bounds numeric inputs and rejects unsupported themes and features', () => {
    const settings = normalizeSettings({ fontScale: 99, theme: 'inverted', lineHeight: NaN, grayscale: 'yes', magnifier: true, unknown: true });
    expect(settings.fontScale).toBe(2);
    expect(settings.theme).toBe('default');
    expect(settings.lineHeight).toBe(1.5);
    expect(settings.grayscale).toBe(false);
    expect(settings.magnifier).toBe(true);
    expect(settings).not.toHaveProperty('unknown');
    expect(normalizeSettings({ fontScale: -1 }).fontScale).toBe(MIN_FONT_SCALE);
  });
  it('round trips versioned preferences', () => {
    const storage = new Map();
    const store = createPreferenceStore('test', { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) });
    expect(store.save({ ...DEFAULT_SETTINGS, theme: 'dark', fontScale: 1.4 })).toBe(true);
    expect(store.load()).toMatchObject({ theme: 'dark', fontScale: 1.4 });
    storage.set('test', '{broken');
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
    storage.set('test', JSON.stringify({ version: 999, settings: { theme: 'dark' } }));
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
  });
  it('continues with unavailable storage', () => {
    const store = createPreferenceStore('test', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } });
    expect(store.load()).toEqual(DEFAULT_SETTINGS);
    expect(store.save(DEFAULT_SETTINGS)).toBe(false);
  });
});

describe('10% text-size steps', () => {
  it('snaps arbitrary inputs to 10% steps and preserves all 50%-200% settings', () => {
    expect(normalizeSettings({ fontScale: 1.02 }).fontScale).toBe(1);
    expect(normalizeSettings({ fontScale: 0.625 }).fontScale).toBe(0.6);
    expect(normalizeSettings({ fontScale: 1.99 }).fontScale).toBe(2);
    expect(normalizeSettings({ fontScale: 0.01 }).fontScale).toBe(0.5);
    for (let percent = 50; percent <= 200; percent += 10) {
      expect(normalizeSettings({ fontScale: percent / 100 }).fontScale).toBe(percent / 100);
    }
  });
  it('normalizes previously saved fractional sizes on load and save', () => {
    let saved = JSON.stringify({ version: 1, settings: { fontScale: 1.02, theme: 'dark' } });
    const store = createPreferenceStore('test', { getItem: () => saved, setItem: (_key, value) => { saved = value; } });
    expect(store.load()).toMatchObject({ fontScale: 1, theme: 'dark' });
    saved = JSON.stringify({ version: 1, settings: { fontScale: 0.1 } });
    expect(store.load().fontScale).toBe(0.5);
    store.save({ fontScale: 0.625 });
    expect(JSON.parse(saved).settings.fontScale).toBe(0.6);
  });
});
