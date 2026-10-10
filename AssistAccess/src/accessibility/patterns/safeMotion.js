/**
 * Constants and checks for the safe flashing-prevention pattern.
 *
 * This is the *authoring-side* half of feature 1. A toolbar can only mitigate
 * flashing that other people shipped; an application that controls its own content
 * should simply never ship it. These helpers give that rule a name, a number and a
 * development-time warning.
 *
 * The numbers come from WCAG 2.3.1 (Three Flashes or Below Threshold):
 *  - no more than three flashes in any one second period,
 *  - the flashing area must stay below the general flash threshold (approximated
 *    here as the commonly used ~21,824 CSS px "small safe area", or 25% of the
 *    viewport),
 *  - flashes involving saturated red are treated more strictly.
 */

import { FLASH_LIMITS } from '../constants.js';

export const SAFE_MOTION = Object.freeze({
  MAX_FLASHES_PER_SECOND: FLASH_LIMITS.MAX_FLASHES_PER_SECOND,
  /** Shortest animation cycle that still counts as three flashes per second. */
  MIN_SAFE_CYCLE_MS: Math.ceil(1000 / FLASH_LIMITS.MAX_FLASHES_PER_SECOND),
  SAFE_AREA_PX: FLASH_LIMITS.SAFE_AREA_PX,
  SAFE_AREA_VIEWPORT_RATIO: FLASH_LIMITS.LARGE_AREA_VIEWPORT_RATIO,
});

/** True when a cycle rate is at or below the three-flashes-per-second limit. */
export function isSafeFlashRate(flashesPerSecond) {
  const rate = Number(flashesPerSecond);
  if (!Number.isFinite(rate)) return true;
  return rate <= SAFE_MOTION.MAX_FLASHES_PER_SECOND;
}

/** Shortest safe cycle duration for a desired number of flashes per second. */
export function cycleDurationForRate(flashesPerSecond) {
  const rate = Number(flashesPerSecond);
  if (!Number.isFinite(rate) || rate <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(1000 / rate);
}

/**
 * Check a planned animation against the thresholds.
 * @returns {{ safe: boolean, problems: string[] }}
 */
export function checkAnimationSafety({
  flashesPerSecond = 0,
  areaPx = 0,
  viewportArea = 0,
  redFlash = false,
} = {}) {
  const problems = [];
  if (!isSafeFlashRate(flashesPerSecond)) {
    problems.push(
      `${flashesPerSecond} flashes per second exceeds the limit of ${SAFE_MOTION.MAX_FLASHES_PER_SECOND}.`,
    );
  }
  const largeByArea = areaPx >= SAFE_MOTION.SAFE_AREA_PX;
  const largeByViewport =
    viewportArea > 0 && areaPx / viewportArea >= SAFE_MOTION.SAFE_AREA_VIEWPORT_RATIO;
  if (!isSafeFlashRate(flashesPerSecond) && (largeByArea || largeByViewport)) {
    problems.push('The flashing area is large enough to be hazardous on its own.');
  }
  if (redFlash) {
    problems.push('Saturated red flashes have a stricter threshold and are hazardous at smaller areas.');
  }
  return { safe: problems.length === 0, problems };
}

const isDevelopment =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/**
 * Development-only warning. Silence in production: a console message is a
 * developer tool, not a user-facing safeguard.
 */
export function warnIfUnsafe(options = {}) {
  const { safe, problems } = checkAnimationSafety(options);
  if (safe) return { safe, problems };
  if (isDevelopment && typeof console !== 'undefined' && console.warn) {
    console.warn(
      `[accessibility] Unsafe animation${options.name ? ` "${options.name}"` : ''}:\n- ${problems.join('\n- ')}\n` +
        'Reduce the flash rate, keep the flashing area small, or do not autoplay it and provide pause/stop/hide controls.',
    );
  }
  return { safe, problems };
}
