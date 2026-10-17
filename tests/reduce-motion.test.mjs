import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createMotionApplier } from '../AssistAccess/src/accessibility/core/apply/applyMotion.js';
import { buildMotionOverrideCss } from '../AssistAccess/src/accessibility/core/apply/forcedStyles.js';

function fixture(run) {
  const dom = new JSDOM('<div class="swiper"><div id="track"></div></div><div id="a11y" data-a11ytb-host><button></button></div>', { pretendToBeVisual: true });
  const previous = { window: globalThis.window, document: globalThis.document };
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  const frames = new Map(); let frameId = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const animations = [];
  document.getAnimations = () => animations;
  const applier = createMotionApplier();
  const apply = (strategy, on = true, pauseAnimations = false) => applier.apply({
    settings: { visual: { target: 'document' }, motion: { motionStrategy: strategy, pauseAnimations, pauseAutoMedia: false } },
    effectiveReducedMotion: on,
  });
  const animate = (time, target = document.getElementById('track'), delay = 0) => {
    const animation = { currentTime: time, playState: 'running',
      effect: { target, getTiming: () => ({ delay, iterations: Infinity }) },
      pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; },
      finish() { throw new Error('Must not dispatch completion/restart autoplay'); },
    };
    animations.push(animation); return animation;
  };
  try { run({ apply, animate, applier, frames }); }
  finally { applier.cleanup(); dom.window.close(); Object.assign(globalThis, previous); }
}

test('pause preserves exact current frame and catches new transitions before the next paint', () => fixture(({ apply, animate, frames }) => {
  const animation = animate(3240);
  apply('pause');
  assert.equal(animation.currentTime, 3240);
  assert.equal(animation.playState, 'paused');
  const late = animate(160);
  const [id, tick] = frames.entries().next().value; frames.delete(id); tick();
  assert.equal(late.currentTime, 160);
  assert.equal(late.playState, 'paused');
  apply('pause', false);
  assert.equal(animation.playState, 'running');
  assert.equal(animation.currentTime, 3240);
  assert.equal(frames.size, 0);
}));

test('instant holds the starting frame and restores original progress when disabled', () => fixture(({ apply, animate }) => {
  const animation = animate(3240);
  apply('instant');
  assert.equal(animation.currentTime, 0);
  assert.equal(animation.playState, 'paused');
  apply('instant');
  apply('instant', false);
  assert.equal(animation.currentTime, 3240);
  assert.equal(animation.playState, 'running');
}));

test('switching strategies uses the same timeline without creating extra overlays', () => fixture(({ apply, animate, applier }) => {
  const animation = animate(1200, undefined, 350);
  apply('pause'); assert.equal(animation.currentTime, 1200);
  apply('instant'); assert.equal(animation.currentTime, 350);
  apply('pause'); assert.equal(animation.currentTime, 350);
  assert.equal(applier.getPausedAnimationCount(), 1);
  assert.equal(document.querySelectorAll('.swiper').length, 1);
  apply('pause', false); assert.equal(animation.currentTime, 1200);
}));

test('swiper autoplay stops once, stays stopped, and resumes only if previously running', () => fixture(({ apply, animate }) => {
  let stops = 0, starts = 0;
  const autoplay = { running: true, stop() { this.running = false; stops++; }, start() { this.running = true; starts++; } };
  document.querySelector('.swiper').swiper = { autoplay };
  const animation = animate(2800);
  apply('pause'); apply('pause'); apply('instant');
  assert.equal(stops, 1); assert.equal(starts, 0);
  assert.equal(animation.playState, 'paused');
  apply('instant', false);
  assert.equal(starts, 1);
  autoplay.running = false;
  apply('pause'); apply('pause', false);
  assert.equal(starts, 1);
}));

test('pause commits Swiper rendered position instead of its pending destination', () => fixture(({ apply }) => {
  const wrapper = document.getElementById('track');
  wrapper.style.transitionDuration = '7000ms';
  wrapper.style.transform = 'translate3d(-600px, 0px, 0px)';
  let translate = -600, reads = 0;
  const autoplay = { running: true, stop() { this.running = false; }, start() { this.running = true; } };
  document.querySelector('.swiper').swiper = {
    wrapperEl: wrapper, autoplay,
    getTranslate() { reads++; return -127.5; },
    setTransition(duration) { wrapper.style.transitionDuration = `${duration}ms`; },
    setTranslate(value) { translate = value; wrapper.style.transform = `translate3d(${value}px, 0px, 0px)`; },
  };
  apply('pause');
  assert.equal(translate, -127.5);
  assert.equal(wrapper.style.transform, 'translate3d(-127.5px, 0px, 0px)');
  assert.equal(wrapper.style.transitionDuration, '0ms');
  apply('pause');
  assert.equal(reads, 1);
  assert.equal(translate, -127.5);
  apply('pause', false);
  assert.equal(wrapper.style.transitionDuration, '7000ms');
  assert.equal(translate, -127.5);
  assert.equal(autoplay.running, true);
}));

test('instant does not change Swiper transition styles or commit a new position', () => fixture(({ apply }) => {
  document.querySelector('.swiper').swiper = {
    wrapperEl: document.getElementById('track'),
    autoplay: { running: true, stop() { this.running = false; }, start() {} },
    getTranslate() { throw new Error('Only pause should commit current position'); },
    setTransition() { throw new Error('Instant behavior must remain unchanged'); },
    setTranslate() { throw new Error('Instant behavior must remain unchanged'); },
  };
  apply('instant');
}));

test('toolbar and originally paused animations remain unchanged; separate Pause Animations keeps its behavior', () => fixture(({ apply, animate, frames }) => {
  const toolbar = animate(500, document.querySelector('#a11y button'));
  const paused = animate(700); paused.playState = 'paused';
  apply('pause'); apply('pause', false);
  assert.equal(toolbar.playState, 'running'); assert.equal(toolbar.currentTime, 500);
  assert.equal(paused.playState, 'paused');
  const running = animate(900);
  apply('instant', false, true);
  assert.equal(running.currentTime, 900); assert.equal(running.playState, 'paused');
  assert.equal(frames.size, 0);
}));

test('reduced CSS never retimes animations or cancels transitions; separate Pause Animations CSS stays intact', () => {
  for (const strategy of ['instant', 'pause']) {
    const css = buildMotionOverrideCss({ strategy });
    assert.doesNotMatch(css, /animation-duration|animation-delay|animation-iteration-count|transition-property|transition-duration/);
  }
  assert.match(buildMotionOverrideCss({ pauseAll: true }), /transition-property: none/);
});
