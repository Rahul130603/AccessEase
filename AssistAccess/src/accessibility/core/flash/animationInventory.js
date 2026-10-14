/**
 * Animation inventory.
 *
 * Finds animations that are running in the page and estimates whether they
 * *alternate in relative luminance* — which is what the WCAG three-flashes rule
 * is about.
 *
 * Two deliberate design choices:
 *  - A spinner (rotation) is not flagged: it animates `transform`, the luminance
 *    of its keyframes does not change, so the estimate stays at zero. This is why
 *    the check is luminance-based rather than "any infinite animation".
 *  - One-shot entrance animations are not flagged either: an animation that runs
 *    once cannot flash more than three times per second, no matter how short it
 *    is. Only repeating animations (iterations > 1 or infinite) are candidates.
 *
 * Confidence is reported honestly: colour changes and visibility toggles are
 * measurable ("high"), opacity-only or filter-only changes are approximations
 * against an unknown backdrop ("low").
 */

import { FLASH_LIMITS } from '../../constants.js';
import { isSaturatedRed, maxLuminanceDelta, parseColor } from '../color.js';
import {
  describeElement,
  elementAreaPx,
  elementKey,
  isExcludedFromScanning,
  isInScope,
  isOwnedByToolbar,
} from '../dom/domScope.js';

const COLOR_KEYS = [
  'backgroundColor',
  'background',
  'color',
  'outlineColor',
  'borderTopColor',
  'borderColor',
  'fill',
  'stroke',
];

export function isAnimationApiSupported() {
  return typeof document !== 'undefined' && typeof document.getAnimations === 'function';
}

/**
 * Estimate the luminance swing of a keyframe list.
 * @param {Array<object>} keyframes from KeyframeEffect.getKeyframes()
 */
export function analyzeKeyframes(keyframes) {
  const colors = [];
  const properties = new Set();
  const opacityValues = [];
  let sawHidden = false;
  let sawVisible = false;

  (Array.isArray(keyframes) ? keyframes : []).forEach((keyframe) => {
    COLOR_KEYS.forEach((key) => {
      const value = keyframe[key];
      if (typeof value !== 'string') return;
      const parsed = parseColor(value);
      if (!parsed) return;
      colors.push(parsed);
      properties.add('color');
    });
    if ((typeof keyframe.opacity === 'number' || typeof keyframe.opacity === 'string') && String(keyframe.opacity).trim() !== '' && Number.isFinite(Number(keyframe.opacity))) {
      opacityValues.push(Number(keyframe.opacity));
      properties.add('opacity');
    }
    if (typeof keyframe.visibility === 'string') {
      properties.add('visibility');
      if (keyframe.visibility.indexOf('hidden') === 0 || keyframe.visibility === 'collapse') sawHidden = true;
      else sawVisible = true;
    }
    if (typeof keyframe.filter === 'string') properties.add('filter');
    if (typeof keyframe.transform === 'string') properties.add('transform');
  });

  const colorDelta = maxLuminanceDelta(colors);
  const opacityDelta =
    opacityValues.length > 1 ? Math.max(...opacityValues) - Math.min(...opacityValues) : 0;
  const visibilityToggle = sawHidden && sawVisible;

  // A hidden/visible alternation is a full on/off swing; an opacity swing is an
  // approximation because the backdrop is unknown.
  const luminanceDelta = Math.min(
    1,
    Math.max(colorDelta, opacityDelta * 0.85, visibilityToggle ? 0.9 : 0),
  );

  return {
    luminanceDelta,
    redFlashSuspected: colors.some(isSaturatedRed),
    properties: Array.from(properties),
    confidence:
      colorDelta >= FLASH_LIMITS.MIN_LUMINANCE_DELTA || visibilityToggle ? 'high' : 'low',
  };
}

function readTimingMs(timing) {
  if (!timing) return null;
  const duration = timing.duration;
  if (typeof duration === 'number' && duration > 0) return duration;
  return null;
}

/**
 * Collect animation candidates inside a scope.
 *
 * @param {{root: Element, maxCandidates?: number}} options
 * @returns {Array<object>} candidates, one per (element, animation)
 */
export function collectAnimationCandidates({ root, maxCandidates = 200 } = {}) {
  if (!isAnimationApiSupported() || !root) return [];

  let animations = [];
  try {
    animations = document.getAnimations();
  } catch (error) {
    return [];
  }

  const candidates = [];
  const seen = new Set();

  for (let index = 0; index < animations.length; index += 1) {
    if (candidates.length >= maxCandidates) break;
    const animation = animations[index];
    const effect = animation && animation.effect;
    const target = effect && effect.target;
    if (!target || target.nodeType !== 1) continue;
    if (!isInScope(target, root) || isOwnedByToolbar(target)) continue;
    if (isExcludedFromScanning(target)) continue;
    // A blink can be fully transparent or visibility:hidden at scan time.
    // Keep it eligible, including when paused on its hidden frame, so rescanning
    // does not undo protection. Elements without a rendered box stay excluded.
    const rect = target.getBoundingClientRect();
    if (target.hidden || rect.width <= 1 || rect.height <= 1) continue;
    const style = target.ownerDocument.defaultView.getComputedStyle(target);
    if (style.display === 'none') continue;

    const timing = typeof effect.getTiming === 'function' ? effect.getTiming() : null;
    const durationMs = readTimingMs(timing);
    if (!durationMs) continue;

    let iterations = timing && timing.iterations !== undefined ? timing.iterations : 1;
    if (iterations === Infinity || !Number.isFinite(Number(iterations))) iterations = Infinity;
    else iterations = Number(iterations);

    const repeats = iterations === Infinity || iterations > 1;
    const playbackRate = Number(animation.playbackRate) || 1;

    const keyframes = typeof effect.getKeyframes === 'function' ? effect.getKeyframes() : [];
    const analysis = analyzeKeyframes(keyframes);
    const key = elementKey(target);
    const id = `${key}#${index}`;
    if (seen.has(id)) continue;
    seen.add(id);

    candidates.push({
      id,
      elementKey: key,
      kind: 'animation',
      element: target,
      animation,
      label: describeElement(target),
      durationMs,
      iterations,
      playbackRate,
      // One full light→dark→light cycle counts as one flash under the WCAG
      // definition ("a pair of opposing changes in relative luminance").
      flashesPerSecond: repeats ? (1000 / durationMs) * Math.abs(playbackRate) : 0,
      areaPx: elementAreaPx(target),
      luminanceDelta: analysis.luminanceDelta,
      redFlashSuspected: analysis.redFlashSuspected,
      properties: analysis.properties,
      confidence: analysis.confidence,
    });
  }

  return candidates;
}
