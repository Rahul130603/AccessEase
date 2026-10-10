/**
 * Media, embed and canvas inventory.
 *
 * This module exists mainly to be honest. A page script cannot read the pixels of
 * a cross-origin iframe, a video, an animated image or a canvas unless the content
 * is same-origin and untainted. The toolbar therefore offers:
 *   - a *stop* control where the platform allows one (media pause),
 *   - a *hide* control where the element can be taken out of view,
 *   - an explicit "cannot be inspected" list where neither is provable.
 *
 * Nothing here claims to detect flashing inside that content.
 */

import {
  describeElement,
  elementKey,
  isElementVisible,
  isExcludedFromScanning,
  isOwnedByToolbar,
} from '../dom/domScope.js';

export const MEDIA_KINDS = Object.freeze({
  VIDEO: 'video',
  AUDIO: 'audio',
  ANIMATED_IMAGE: 'animated-image',
  MARQUEE: 'marquee',
  SVG_ANIMATION: 'svg-animation',
  CANVAS: 'canvas',
  EMBED: 'third-party-embed',
});

const ANIMATED_IMAGE_PATTERN = /\.(gif|apng)(\?|#|$)/i;

function srcLooksAnimated(element) {
  const src = element.getAttribute('src') || '';
  const srcset = element.getAttribute('srcset') || '';
  if (ANIMATED_IMAGE_PATTERN.test(src) || ANIMATED_IMAGE_PATTERN.test(srcset)) return true;
  if (src.startsWith('data:image/gif')) return true;
  return false;
}

/**
 * Elements the toolbar can act on but cannot measure.
 * @param {{root: Element, max?: number}} options
 */
export function collectMediaCandidates({ root, max = 100 } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  const results = [];

  const push = (element, kind, action, note) => {
    if (results.length >= max) return;
    if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
    if (!isElementVisible(element)) return;
    results.push({
      elementKey: elementKey(element),
      kind,
      element,
      action,
      measurable: false,
      label: describeElement(element),
      note,
    });
  };

  root.querySelectorAll('video[autoplay], video[loop]').forEach((element) => {
    push(
      element,
      MEDIA_KINDS.VIDEO,
      'pause',
      'Video frames cannot be analysed from the page, but playback can be stopped.',
    );
  });

  root.querySelectorAll('audio[autoplay]').forEach((element) => {
    push(element, MEDIA_KINDS.AUDIO, 'pause', 'Audio can be stopped, but its content cannot be inspected.');
  });

  root.querySelectorAll('img').forEach((element) => {
    if (!srcLooksAnimated(element)) return;
    push(
      element,
      MEDIA_KINDS.ANIMATED_IMAGE,
      'hide',
      'Animated images cannot be paused from the page, only hidden.',
    );
  });

  root.querySelectorAll('marquee, blink').forEach((element) => {
    push(
      element,
      MEDIA_KINDS.MARQUEE,
      'hide',
      'Scrolling or blinking text cannot be paused from the page, only hidden.',
    );
  });

  root.querySelectorAll('svg animate, svg animateTransform').forEach((element) => {
    push(
      element,
      MEDIA_KINDS.SVG_ANIMATION,
      'hide',
      'SVG animations are not always exposed to the page; hiding is the only reliable stop.',
    );
  });

  return results;
}

/**
 * Content that cannot be inspected or stopped at all.
 * @param {{root: Element, max?: number}} options
 */
export function collectUninspectable({ root, max = 50 } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  const results = [];

  const push = (element, kind, reason) => {
    if (results.length >= max) return;
    if (isOwnedByToolbar(element)) return;
    if (!isElementVisible(element)) return;
    results.push({
      elementKey: elementKey(element),
      kind,
      label: describeElement(element) || element.tagName.toLowerCase(),
      reason,
    });
  };

  root.querySelectorAll('canvas').forEach((element) => {
    push(element, MEDIA_KINDS.CANVAS, 'canvas: pixel content cannot be read or measured.');
  });

  root.querySelectorAll('iframe').forEach((element) => {
    push(element, MEDIA_KINDS.EMBED, 'embedded frame: content from another document cannot be inspected.');
  });

  root.querySelectorAll('object, embed').forEach((element) => {
    push(element, MEDIA_KINDS.EMBED, 'plugin content: cannot be inspected or controlled.');
  });

  return results;
}

/** Pause a media element. Returns true when playback was actually stopped. */
export function pauseMediaElement(element) {
  if (!element || typeof element.pause !== 'function') return false;
  try {
    if (element.paused || element.ended) return false;
    element.pause();
    return true;
  } catch (error) {
    return false;
  }
}

/** True when the element supports a real stop control. */
export function isPausableMedia(element) {
  return Boolean(
    element &&
      (element.tagName === 'VIDEO' || element.tagName === 'AUDIO') &&
      typeof element.pause === 'function',
  );
}
