import { describe, it, expect } from 'vitest';
import { COLOR_MODES, colorModeVariables } from '../src/colorVision/colorModes.js';
import { createPreferenceStore, DEFAULT_SETTINGS } from '../src/engine/preferenceStore.js';
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a, b) => { const values = [luminance(a),luminance(b)].sort((x,y) => y-x); return (values[0]+0.05)/(values[1]+0.05); };
describe('color assistance palettes', () => {
  it('contains exactly five unique working palettes with readable text and button colors', () => {
    expect(COLOR_MODES.map(mode => mode.id)).toEqual(['default','protanopia','deuteranopia','tritanopia','monochrome']);
    expect(new Set(COLOR_MODES.map(mode => mode.colors.primary)).size).toBe(5);
    for (const {colors} of COLOR_MODES) {
      for (const background of [colors.background, colors.surface]) {
        for (const foreground of [colors.text,colors.muted,colors.link]) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast('#ffffff',colors.primary)).toBeGreaterThanOrEqual(4.5);
      for (const status of ['success','error','warning','information']) expect(contrast(colors[status], colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('round-trips each mode in shared preferences and produces neutral monochrome tokens', () => {
    let saved;
    const store = createPreferenceStore('test', { getItem: () => saved, setItem: (_key,value) => {saved=value;} });
    for (const mode of COLOR_MODES) {
      store.save({...DEFAULT_SETTINGS,colorVisionMode:mode.id,fontScale:1.3});
      expect(store.load()).toMatchObject({colorVisionMode:mode.id,fontScale:1.3});
    }
    for (const value of Object.values(colorModeVariables('monochrome'))) expect(value.slice(1,3)).toBe(value.slice(3,5));
  });
});
