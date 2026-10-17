/** Reversible motion control. Reduced motion freezes animation timelines without
 * shortening CSS durations, which would dispatch end events and restart carousels.
 * The instant option holds the starting frame; pause holds the current frame.
 */

import { DATA_ATTRS, STYLE_IDS } from '../../constants.js';
import { setStyleText, markAttribute, unmarkAttribute, getToolbarHost } from '../dom/domPatches.js';
import { isInScope, isOwnedByToolbar, resolveTargetRoot } from '../dom/domScope.js';
import { buildMotionOverrideCss } from './forcedStyles.js';

const AUTOPLAY_MEDIA_SELECTOR = 'video[autoplay], audio[autoplay]';

/** Keep the existing periodic pass for Pause Animations and autoplay media.
 * Reduce Motion also checks each render frame for newly created animations.
 */
const RECHECK_INTERVAL_MS = 2500;

export function createMotionApplier() {
  /** @type {Map<Animation, string>} animation → playState before we paused it */
  const pausedAnimations = new Map();
  /** @type {Set<HTMLMediaElement>} */
  const pausedMedia = new Set();
  const stoppedCarousels = new Set();
  const heldCarousels = new Map();
  let scopeElement = null;
  let signature = null;
  let recheckTimer = null;
  let motionFrame = null;
  let mediaObserver = null;
  let mediaWatchRoot = null;
  /** Latest applied configuration, read by the periodic re-check. */
  let latest = { root: null, strategy: 'instant', pauseAutoMedia: false, pauseMotion: false };

  function onMediaPlay(event) {
    const media=event.target;
    if(!latest.pauseAutoMedia||!latest.root||!media?.matches?.(AUTOPLAY_MEDIA_SELECTOR)||!isInScope(media,latest.root)||isOwnedByToolbar(media))return;
    pauseAutoplayingMedia(latest.root);
  }
  function stopMediaWatch() {
    mediaObserver?.disconnect();mediaObserver=null;mediaWatchRoot=null;
    document.removeEventListener('play',onMediaPlay,true);
  }
  function watchMedia(root) {
    if(mediaWatchRoot===root)return;
    stopMediaWatch();mediaWatchRoot=root;
    document.addEventListener('play',onMediaPlay,true);
    mediaObserver=new MutationObserver(()=>{if(latest.pauseAutoMedia)pauseAutoplayingMedia(root);});
    mediaObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['autoplay','src']});
  }

  function stopCarousels(root, strategy) {
    root.querySelectorAll('.swiper').forEach(element => {
      if (isOwnedByToolbar(element)) return;
      const swiper = element.swiper;
      if (!swiper || swiper.destroyed) return;
      const owned = stoppedCarousels.has(swiper);
      if (!owned && !swiper.autoplay?.running) return;
      // Swiper's translate field is the destination, not the position currently
      // painted during its CSS transition. Read the rendered position first.
      const hold = strategy === 'pause' && !heldCarousels.has(swiper)
        && swiper.wrapperEl && typeof swiper.getTranslate === 'function'
        && typeof swiper.setTranslate === 'function' && typeof swiper.setTransition === 'function';
      const current = hold ? swiper.getTranslate() : null;
      if (!owned) {
        swiper.autoplay.stop();
        stoppedCarousels.add(swiper);
      }
      if (hold && Number.isFinite(current)) {
        const style = swiper.wrapperEl.style;
        heldCarousels.set(swiper, {
          duration: style.getPropertyValue('transition-duration'),
          priority: style.getPropertyPriority('transition-duration'),
        });
        // Commit the visible position before cancelling the old transition;
        // otherwise it snaps to the pending slide destination on cancellation.
        swiper.setTransition(0);
        swiper.setTranslate(current);
      }
    });
  }

  function resumeCarousels() {
    stoppedCarousels.forEach(swiper => {
      if (!swiper.destroyed) {
        const saved = heldCarousels.get(swiper);
        if (saved) {
          if (saved.duration) swiper.wrapperEl.style.setProperty('transition-duration', saved.duration, saved.priority);
          else swiper.wrapperEl.style.removeProperty('transition-duration');
        }
        swiper.autoplay?.start();
      }
    });
    stoppedCarousels.clear();
    heldCarousels.clear();
  }

  function resumeAnimations() {
    pausedAnimations.forEach((saved, animation) => {
      try {
        if (saved.rewound) animation.currentTime = saved.time;
        if (saved.state === 'running' || saved.state === 'pending') animation.play();
      } catch (error) {
        /* the animation may have been cancelled by the page */
      }
    });
    pausedAnimations.clear();
  }

  /**
   * Pause running animations in scope.
   * @param {Element} root
   * @param {'instant'|'pause'} strategy
   */
  function pauseRunningAnimations(root, strategy, legacyPause = false) {
    if (typeof document.getAnimations !== 'function') return;
    let animations = [];
    try {
      animations = document.getAnimations();
    } catch (error) {
      return;
    }
    animations.forEach((animation) => {
      if (!animation || !animation.effect) return;
      const target = animation.effect.target;
      if (!target || !isInScope(target, root)) return;
      if (isOwnedByToolbar(target)) return;
      const saved = pausedAnimations.get(animation);
      if (legacyPause) {
        if (saved || !['running', 'pending'].includes(animation.playState)) return;
        try {
          const state = animation.playState;
          animation.pause();
          pausedAnimations.set(animation, { state, rewound: false });
        } catch { /* cancelled by the page */ }
        return;
      }
      const playState = animation.playState;
      if (!saved && !['running', 'pending', 'paused'].includes(playState)) return;
      try {
        const record = saved || { state: playState, time: animation.currentTime, rewound: false };
        // Preserve time explicitly: pause() may be pending until the next frame.
        const heldTime = animation.currentTime;
        animation.pause();
        if (strategy === 'instant') {
          const timing = animation.effect.getTiming?.();
          animation.currentTime = Math.max(0, Number(timing?.delay) || 0);
          record.rewound = true;
        } else if (heldTime !== null) {
          animation.currentTime = heldTime;
        }
        pausedAnimations.set(animation, record);
      } catch (error) {
        /* ignore animations we cannot control */
      }
    });
  }

  function pauseAutoplayingMedia(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll(AUTOPLAY_MEDIA_SELECTOR).forEach((element) => {
      if (isOwnedByToolbar(element)) return;
      if (element.paused || element.ended) return;
      try {
        element.pause();
        pausedMedia.add(element);
        markAttribute(element, DATA_ATTRS.MEDIA_PAUSED, '1');
      } catch (error) {
        /* ignore media we cannot control */
      }
    });
  }

  /**
   * Stop pausing media. The toolbar deliberately does not call play(): resuming
   * media automatically is hostile. It only stops holding it paused.
   */
  function releaseMedia() {
    pausedMedia.forEach((element) => {
      unmarkAttribute(element, DATA_ATTRS.MEDIA_PAUSED);
    });
    pausedMedia.clear();
  }

  function watchMotion() {
    if (motionFrame !== null || typeof window.requestAnimationFrame !== 'function') return;
    const tick = () => {
      motionFrame = null;
      if (!latest.pauseMotion || !latest.root) return;
      if (!document.hidden) {
        stopCarousels(latest.root, latest.strategy);
        pauseRunningAnimations(latest.root, latest.strategy);
      }
      motionFrame = window.requestAnimationFrame(tick);
    };
    motionFrame = window.requestAnimationFrame(tick);
  }

  function teardown() {
    if (motionFrame !== null) window.cancelAnimationFrame(motionFrame);
    motionFrame = null;
    if (recheckTimer !== null) {
      clearInterval(recheckTimer);
      recheckTimer = null;
    }
    setStyleText(STYLE_IDS.MOTION, '');
    if (scopeElement) {
      unmarkAttribute(scopeElement, DATA_ATTRS.MOTION_SCOPE);
      scopeElement = null;
    }
    resumeAnimations();
    resumeCarousels();
    releaseMedia();
    stopMediaWatch();
    latest = { root: null, strategy: 'instant', pauseAutoMedia: false, pauseMotion: false };
    signature = null;
  }

  /**
   * @param {object} options
   * @param {object} options.settings
   * @param {boolean} options.effectiveReducedMotion resolved setting + OS preference
   * @param {string|null} [options.contentRootSelector]
   * @param {'auto'|'document'|'contentRoot'} [options.forcedTarget]
   */
  function apply({
    settings,
    effectiveReducedMotion = false,
    contentRootSelector = null,
    forcedTarget = 'auto',
  } = {}) {
    if (typeof document === 'undefined') return;

    const pauseAll = settings.motion.pauseAnimations === true;
    const reduce = effectiveReducedMotion === true;
    const pauseMedia = settings.motion.pauseAutoMedia === true;

    if (!pauseAll && !reduce && !pauseMedia) {
      teardown();
      return;
    }

    const root = resolveTargetRoot({
      settingTarget: settings.visual.target,
      forcedTarget,
      contentRootSelector,
    });
    if (!root) return;

    if ((pauseAll || reduce) && scopeElement !== root) {
      if (scopeElement) unmarkAttribute(scopeElement, DATA_ATTRS.MOTION_SCOPE);
      scopeElement = root;
      markAttribute(scopeElement, DATA_ATTRS.MOTION_SCOPE, '1');
    }

    const strategy = pauseAll ? 'pause' : settings.motion.motionStrategy === 'pause' ? 'pause' : 'instant';
    const nextSignature = `${strategy}|${pauseAll ? 'pauseAll' : 'reduce'}`;
    // Snapshot CSS transitions before any override can cancel or retime them.
    if (reduce && !pauseAll) {
      stopCarousels(root, strategy);
      pauseRunningAnimations(root, strategy);
    } else resumeCarousels();
    if (!pauseAll && !reduce) {
      setStyleText(STYLE_IDS.MOTION,'');
      if(scopeElement)unmarkAttribute(scopeElement,DATA_ATTRS.MOTION_SCOPE);
      scopeElement=null;signature=null;resumeAnimations();resumeCarousels();
    } else if (signature !== nextSignature) {
      setStyleText(STYLE_IDS.MOTION, buildMotionOverrideCss({ strategy, pauseAll }));
      signature = nextSignature;
    }

    if(pauseAll || reduce)pauseRunningAnimations(root, strategy, pauseAll);

    latest = { root, strategy, pauseAutoMedia: pauseMedia, pauseMotion: pauseAll || reduce, legacyPause: pauseAll };
    if (reduce && !pauseAll) watchMotion();
    else if (motionFrame !== null) {
      window.cancelAnimationFrame(motionFrame);motionFrame=null;
    }
    if (pauseMedia) {watchMedia(root);pauseAutoplayingMedia(root);}
    else {stopMediaWatch();releaseMedia();}

    if (recheckTimer === null) {
      recheckTimer = setInterval(() => {
        if (typeof document === 'undefined' || document.hidden || !latest.root) return;
        if(latest.pauseMotion)pauseRunningAnimations(latest.root, latest.strategy, latest.legacyPause);
        if (latest.pauseAutoMedia) pauseAutoplayingMedia(latest.root);
      }, RECHECK_INTERVAL_MS);
    }
  }

  return {
    apply,
    cleanup: teardown,
    getPausedAnimationCount: () => pausedAnimations.size,
    getPausedMediaCount: () => pausedMedia.size,
    /** Used by the panel's "resume" affordance. */
    resumeAll() {
      resumeAnimations();
      releaseMedia();
    },
    getScopeElement: () => scopeElement,
    getToolbarHost,
  };
}
