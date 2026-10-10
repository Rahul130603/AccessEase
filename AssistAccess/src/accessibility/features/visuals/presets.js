/**
 * Visual presets — starting points, not diagnoses.
 *
 * Each preset is a partial patch: values it does not mention keep their current
 * setting, so "Higher contrast" does not silently reset brightness. Every preset
 * stays inside the ranges from settingsSchema.js, so no preset can push the page
 * into unreadable territory.
 */

import { VISUAL_DEFAULTS } from '../../core/settingsSchema.js';

export const VISUAL_PRESETS = Object.freeze([
  {
    id: 'default',
    label: 'Default',
    description: 'No visual adjustment.',
    values: { ...VISUAL_DEFAULTS },
  },
  {
    id: 'brighter',
    label: 'Brighter',
    description: 'Brightness 125%.',
    values: { brightness: 125 },
  },
  {
    id: 'dimmer',
    label: 'Dimmer',
    description: 'Brightness 85%.',
    values: { brightness: 85 },
  },
  {
    id: 'highContrast',
    label: 'Higher contrast',
    description: 'Contrast 130%.',
    values: { contrast: 130 },
  },
  {
    id: 'softContrast',
    label: 'Softer contrast',
    description: 'Contrast 85%.',
    values: { contrast: 85 },
  },
  {
    id: 'muted',
    label: 'Muted colours',
    description: 'Saturation 60%.',
    values: { saturation: 60 },
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    description: 'Saturation 0%, so all colour is removed.',
    values: { saturation: 0 },
  },
]);

/** Full value set a preset produces. */
export function resolvePresetValues(preset) {
  return { ...VISUAL_DEFAULTS, ...(preset.values || {}) };
}

/**
 * Which preset (if any) matches the current values.
 * @returns {string} preset id or 'custom'
 */
export function matchPresetId(values) {
  const found = VISUAL_PRESETS.find((preset) => {
    const resolved = resolvePresetValues(preset);
    return (
      resolved.brightness === values.brightness &&
      resolved.contrast === values.contrast &&
      resolved.saturation === values.saturation
    );
  });
  return found ? found.id : 'custom';
}
