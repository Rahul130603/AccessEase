import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { analyzeKeyframes, collectAnimationCandidates } from '../AssistAccess/src/accessibility/core/flash/animationInventory.js';

test('flash inventory reads browser opacity strings and retains a paused hidden frame', () => {
  const frames = [{ opacity: '0' }, { opacity: '1', offset: 0.5 }, { opacity: '0' }];
  assert.equal(analyzeKeyframes(frames).luminanceDelta, 0.85);
  assert.equal(analyzeKeyframes([{ opacity: '' }, { opacity: 'invalid' }]).luminanceDelta, 0);
  const dom = new JSDOM('<div id="blink" style="opacity:0;visibility:hidden"></div><div id="absent" style="display:none"></div>');
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const blink = document.getElementById('blink');
    const absent = document.getElementById('absent');
    blink.getBoundingClientRect = absent.getBoundingClientRect = () => ({ width: 100, height: 100 });
    const animation = {
      playState: 'paused', playbackRate: 1,
      effect: { target: blink, getTiming: () => ({ duration: 150, iterations: Infinity }), getKeyframes: () => frames },
    };
    document.getAnimations = () => [animation, { ...animation, effect: { ...animation.effect, target: absent } }];
    const candidates = collectAnimationCandidates({ root: document.documentElement });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].element, blink);
    assert.equal(candidates[0].luminanceDelta, 0.85);
    assert.ok(candidates[0].flashesPerSecond > 3);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
    dom.window.close();
  }
});
