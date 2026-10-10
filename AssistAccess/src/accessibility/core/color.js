/**
 * Minimal colour maths used by the flash estimator.
 *
 * Only the operations needed to judge whether a change is a *relative luminance*
 * change are implemented: parse, relative luminance (WCAG definition), contrast
 * ratio, saturation-ish measure and a heuristic for saturated red.
 */

const NAMED_COLORS = {
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  yellow: { r: 255, g: 255, b: 0, a: 1 },
  gray: { r: 128, g: 128, b: 128, a: 1 },
  grey: { r: 128, g: 128, b: 128, a: 1 },
};

function clampChannel(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(255, Math.max(0, Math.round(numeric)));
}

function clampAlpha(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(1, Math.max(0, numeric));
}

function hueToRgb(p, q, t) {
  let channel = t;
  if (channel < 0) channel += 1;
  if (channel > 1) channel -= 1;
  if (channel < 1 / 6) return p + (q - p) * 6 * channel;
  if (channel < 1 / 2) return q;
  if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
  return p;
}

function parseHsl(body) {
  const parts = body
    .replace(/\s*\/\s*/g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length < 3) return null;
  const hue = ((parseFloat(parts[0]) % 360) + 360) % 360 / 360;
  const saturation = Math.min(1, Math.max(0, parseFloat(parts[1]) / 100));
  const lightness = Math.min(1, Math.max(0, parseFloat(parts[2]) / 100));
  const alpha = parts[3] !== undefined ? clampAlpha(parts[3]) : 1;
  if (!Number.isFinite(hue) || !Number.isFinite(saturation) || !Number.isFinite(lightness)) return null;

  if (saturation === 0) {
    const value = clampChannel(lightness * 255);
    return { r: value, g: value, b: value, a: alpha };
  }
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  return {
    r: clampChannel(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: clampChannel(hueToRgb(p, q, hue) * 255),
    b: clampChannel(hueToRgb(p, q, hue - 1 / 3) * 255),
    a: alpha,
  };
}

/**
 * Parse a CSS colour string into {r,g,b,a}.
 * Supports hex, rgb()/rgba(), hsl()/hsla() and a small set of keywords.
 * Returns null for anything else (including colour functions we do not model).
 */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (!value) return null;
  if (value === 'none') return null;
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: clampChannel(parseInt(hex[0] + hex[0], 16)),
        g: clampChannel(parseInt(hex[1] + hex[1], 16)),
        b: clampChannel(parseInt(hex[2] + hex[2], 16)),
        a: hex.length === 4 ? clampAlpha(parseInt(hex[3] + hex[3], 16) / 255) : 1,
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: clampChannel(parseInt(hex.slice(0, 2), 16)),
        g: clampChannel(parseInt(hex.slice(2, 4), 16)),
        b: clampChannel(parseInt(hex.slice(4, 6), 16)),
        a: hex.length === 8 ? clampAlpha(parseInt(hex.slice(6, 8), 16) / 255) : 1,
      };
    }
    return null;
  }
  const fnMatch = value.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (fnMatch) {
    const kind = fnMatch[1];
    const body = fnMatch[2];
    if (kind.startsWith('hsl')) return parseHsl(body);
    const parts = body
      .replace(/\s*\/\s*/g, ' ')
      .split(/[\s,]+/)
      .filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (raw) => {
      if (raw.endsWith('%')) return clampChannel((parseFloat(raw) / 100) * 255);
      return clampChannel(parseFloat(raw));
    };
    return {
      r: channel(parts[0]),
      g: channel(parts[1]),
      b: channel(parts[2]),
      a: parts[3] !== undefined ? clampAlpha(parts[3]) : 1,
    };
  }
  return NAMED_COLORS[value] ? { ...NAMED_COLORS[value] } : null;
}

function linearize(channel) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0–1). Alpha is ignored: callers decide how to use it. */
export function relativeLuminance(color) {
  if (!color) return null;
  return 0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b);
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a, b) {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Maximum pairwise luminance difference across a list of colours. */
export function maxLuminanceDelta(colors) {
  const values = colors.map(relativeLuminance).filter((value) => value !== null);
  if (values.length < 2) return 0;
  return Math.max(...values) - Math.min(...values);
}

/** Chroma-style saturation measure (0–1) derived from max/min channels. */
export function saturationOf(color) {
  if (!color) return 0;
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  const lightness = (max + min) / 2 / 255;
  if (max === min) return 0;
  const delta = (max - min) / 255;
  return lightness > 0.5 ? delta / (2 - max / 255 - min / 255) : delta / (max / 255 + min / 255);
}

/**
 * Heuristic for "saturated red", which WCAG 2.3.1 treats as a stricter case.
 * A colour counts when red clearly dominates the other channels and the colour is
 * reasonably saturated.
 */
export function isSaturatedRed(color) {
  if (!color || color.a === 0) return false;
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  if (max === 0) return false;
  return color.r === max && max - Math.max(color.g, color.b) > 40 && (max - min) / max > 0.5;
}
