/**
 * Motion applier: reduced motion, pausing CSS animations/transitions and pausing
 * autoplaying media.
 *
 * Two mechanisms work together:
 *  1. One scoped stylesheet (`a11ytb-motion-overrides`) that reaches CSS
 *     animations and transitions, whichever component declared them. The scope is
 *     the element carrying `data-a11ytb-motion-scope` (the document root by
 *     default) — descendant selectors do not cross shadow boundaries, so the
 *     toolbar's own chrome is untouched by this rule.
 *  2. Web Animations API control for animations that are not driven by CSS
 *     declarations (script-driven `element.animate()`, SVG `<animate>`).
 *
 * Why script-driven animations are always paused rather than fast-forwarded:
 * `Animation.finish()` throws on animations with infinite iterations, and forcing
 * a JS-driven animation to its end state desynchronises the code that owns it.
 * Pausing is reversible and predictable.
 *
 * Known trade-off (surfaced in the panel copy): pausing reveal-on-scroll
 * animations can leave content invisible, which is why "finish immediately" is
 * the default strategy for reduced motion.
 */

import { DATA_ATTRS, STYLE_IDS } from '../../constants.js';
import { setStyleText, markAttribute, unmarkAttribute, getToolbarHost } from '../dom/domPatches.js';
import { isInScope, isOwnedByToolbar, resolveTargetRoot } from '../dom/domScope.js';
import { buildMotionOverrideCss } from './forcedStyles.js';

const AUTOPLAY_MEDIA_SELECTOR = 'video[autoplay], audio[autoplay]';

/**
 * While motion is reduced or paused, script-driven animations that start later
 * (a new component mounts, a carousel initialises) would otherwise keep running.
 * A cheap periodic pass catches them. CSS animations and transitions do not need
 * this: the scoped stylesheet covers elements that appear later automatically.
 */
const RECHECK_INTERVAL_MS = 2500;

export function createMotionApplier() {
  /** @type {Map<Animation, string>} animation → playState before we paused it */
  const pausedAnimations = new Map();
  /** @type {Set<HTMLMediaElement>} */
  const pausedMedia = new Set();
  let scopeElement = null;
  let signature = null;
  let recheckTimer = null;
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

  function resumeAnimations() {
    pausedAnimations.forEach((previousState, animation) => {
      try {
        if (previousState === 'running' || previousState === 'pending') animation.play();
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
  function pauseRunningAnimations(root, strategy) {
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
      if (pausedAnimations.has(animation)) return;

      const timing = typeof animation.effect.getTiming === 'function' ? animation.effect.getTiming() : null;
      const iterations = timing ? timing.iterations : 1;
      const repeating = iterations === Infinity || (typeof iterations === 'number' && iterations > 1);

      // With the "finish immediately" strategy, one-shot animations are left
      // alone: the stylesheet already shortens CSS ones, and pausing a script
      // animation that is about to finish would only risk leaving it mid-state.
      if (strategy === 'instant' && !repeating) return;

      const playState = animation.playState;
      if (playState !== 'running' && playState !== 'pending') return;
      try {
        animation.pause();
        pausedAnimations.set(animation, playState);
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

  function teardown() {
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
    if (!pauseAll && !reduce) {
      setStyleText(STYLE_IDS.MOTION,'');
      if(scopeElement)unmarkAttribute(scopeElement,DATA_ATTRS.MOTION_SCOPE);
      scopeElement=null;signature=null;resumeAnimations();
    } else if (signature !== nextSignature) {
      setStyleText(STYLE_IDS.MOTION, buildMotionOverrideCss({ strategy, pauseAll }));
      signature = nextSignature;
    }

    if(pauseAll || reduce)pauseRunningAnimations(root, strategy);

    latest = { root, strategy, pauseAutoMedia: pauseMedia, pauseMotion: pauseAll || reduce };
    if (pauseMedia) {watchMedia(root);pauseAutoplayingMedia(root);}
    else {stopMediaWatch();releaseMedia();}

    if (recheckTimer === null) {
      recheckTimer = setInterval(() => {
        if (typeof document === 'undefined' || document.hidden || !latest.root) return;
        if(latest.pauseMotion)pauseRunningAnimations(latest.root, latest.strategy);
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
