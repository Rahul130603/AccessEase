/**
 * Flash risk estimation.
 *
 * This is an estimate, not a conformance test. The real WCAG 2.3.1 thresholds are
 * defined in terms of steradians of visual field and a specific luminance
 * formula; a toolbar can only approximate them from timing, colour values and
 * element size.
 *
 * Bands:
 *  - hazard      more than three estimated flashes/second AND (large area OR a
 *                saturated red change). Saturated red flashes are treated as
 *                stricter, as WCAG's red flash threshold is.
 *  - caution     above the rate threshold but small area and no red flash. WCAG
 *                permits small-area flashing, but the area estimate is rough, so
 *                it is still surfaced and can be paused.
 *  - safe        below the rate threshold, or the luminance swing is too small to
 *                be a flash.
 */

import { FLASH_LIMITS } from '../../constants.js';

export const FLASH_BANDS = Object.freeze({
  SAFE: 'safe',
  CAUTION: 'caution',
  HAZARD: 'hazard',
  UNVERIFIED: 'unverified',
});

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * @param {object} input
 * @param {number} input.flashesPerSecond estimated cycles per second
 * @param {number} input.luminanceDelta estimated 0–1 luminance swing
 * @param {number} input.areaPx element area in CSS pixels
 * @param {number} input.viewportArea viewport area in CSS pixels
 * @param {boolean} [input.redFlashSuspected]
 */
export function estimateFlashRisk({
  flashesPerSecond = 0,
  luminanceDelta = 0,
  areaPx = 0,
  viewportArea = 0,
  redFlashSuspected = false,
} = {}) {
  const areaPercent = viewportArea > 0 ? round((areaPx / viewportArea) * 100, 1) : 0;
  const largeByViewport =
    viewportArea > 0 && areaPx / viewportArea >= FLASH_LIMITS.LARGE_AREA_VIEWPORT_RATIO;
  const largeBySafeArea = areaPx >= FLASH_LIMITS.SAFE_AREA_PX;
  const largeArea = largeByViewport || largeBySafeArea;

  const aboveRate = flashesPerSecond > FLASH_LIMITS.MAX_FLASHES_PER_SECOND + 0.001;
  const aboveDelta = luminanceDelta >= FLASH_LIMITS.MIN_LUMINANCE_DELTA;

  if (!aboveRate) {
    return { band: FLASH_BANDS.SAFE, reasons: [], largeArea, areaPercent, flashesPerSecond };
  }
  if (!aboveDelta) {
    return {
      band: FLASH_BANDS.SAFE,
      reasons: ['luminance change below the detection threshold'],
      largeArea,
      areaPercent,
      flashesPerSecond,
    };
  }

  const reasons = [`about ${round(flashesPerSecond)} flashes per second`];
  if (largeArea) reasons.push(`large area (about ${areaPercent}% of the viewport)`);
  else reasons.push('small area, but the area estimate is approximate');
  if (redFlashSuspected) reasons.push('may involve saturated red');

  return {
    band: largeArea || redFlashSuspected ? FLASH_BANDS.HAZARD : FLASH_BANDS.CAUTION,
    reasons,
    largeArea,
    areaPercent,
    flashesPerSecond,
  };
}
