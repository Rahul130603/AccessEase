import React, { useEffect, useId, useRef, useState } from 'react';

import { STYLE_IDS } from '../constants.js';
import { buildSafeMotionPatternCss } from '../core/apply/forcedStyles.js';
import { acquireStyle } from '../core/dom/domPatches.js';
import { useEffectiveReducedMotion } from '../core/SettingsContext.jsx';
import { createStrings } from '../strings.js';
import { isSafeFlashRate, warnIfUnsafe } from './safeMotion.js';

/**
 * Safe design pattern for animated content the *application* controls.
 *
 * What it gives the app (WCAG 2.2.2 Pause, Stop, Hide + 2.3.1 Three Flashes):
 *  1. Nothing starts by itself unless the author explicitly asks for it
 *     (`defaultState="playing"`), so a hazardous animation is never the first thing
 *     on screen. Potentially flashing content should always start paused and be
 *     started deliberately.
 *  2. Pause, stop (pause + reset to the first frame) and hide controls are real
 *     buttons inside a labelled group, keyboard reachable, with visible focus.
 *  3. An explicit flash-rate prop that is checked in development
 *     (`flashesPerSecond`), with the thresholds documented in safeMotion.js.
 *  4. Reduced motion — from the operating system *or* from the toolbar's setting
 *     when the accessibility module is mounted — never autoplays, while an explicit
 *     user start is always honoured.
 *  5. `data-a11ytb-exclude` tells the toolbar's own scanners to leave this subtree
 *     alone, because it is already handled correctly.
 *
 * The animation itself stays in the author's CSS: this component does not inject
 * keyframes or force styles onto the animated content — pausing is expressed as a
 * data attribute (`data-a11ytb-safe-motion="paused"`) plus the small namespaced
 * stylesheet for the pattern's own controls.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children the animated content
 * @param {string} [props.caption] visible caption/description above the frame
 * @param {'paused'|'playing'|'hidden'} [props.defaultState]
 * @param {boolean} [props.allowPause] show the play/pause control
 * @param {boolean} [props.allowStop] show the stop-and-reset control
 * @param {boolean} [props.allowHide] show the hide control
 * @param {number|null} [props.flashesPerSecond] intended flash rate, checked in dev
 * @param {number} [props.areaPx] approximate flashing area in CSS pixels
 * @param {boolean} [props.redFlash] whether saturated red is involved
 * @param {object} [props.strings] copy overrides
 * @param {string} [props.className]
 */
export default function SafeAnimatedContent({
  children,
  caption,
  description,
  defaultState = 'paused',
  allowPause = true,
  allowStop = true,
  allowHide = true,
  flashesPerSecond = null,
  areaPx = 0,
  redFlash = false,
  strings: stringOverrides,
  className = '',
}) {
  const [state, setState] = useState(
    defaultState === 'playing' ? 'playing' : defaultState === 'hidden' ? 'hidden' : 'paused',
  );
  const [resetKey, setResetKey] = useState(0);
  const startedByUserRef = useRef(defaultState === 'playing');
  const reducedMotion = useEffectiveReducedMotion();
  const copy = createStrings(stringOverrides).pattern;
  const captionId = useId();

  // Ref-counted, namespaced stylesheet for the pattern's own markup.
  useEffect(() => acquireStyle(STYLE_IDS.SAFE_PATTERN, buildSafeMotionPatternCss()), []);

  useEffect(() => {
    if (flashesPerSecond === null || flashesPerSecond === undefined) return;
    warnIfUnsafe({ name: caption, flashesPerSecond, areaPx, redFlash });
  }, [flashesPerSecond, areaPx, redFlash, caption]);

  // Reduced motion must never autoplay, but must not fight a deliberate start.
  useEffect(() => {
    if (!reducedMotion || startedByUserRef.current) return;
    setState((current) => (current === 'playing' ? 'paused' : current));
  }, [reducedMotion]);

  const start = () => {
    startedByUserRef.current = true;
    setState('playing');
  };
  const pause = () => {
    startedByUserRef.current = false;
    setState('paused');
  };
  const stop = () => {
    startedByUserRef.current = false;
    setState('paused');
    setResetKey((current) => current + 1);
  };
  const hide = () => setState('hidden');
  const show = () => setState('paused');

  const notice =
    state === 'hidden'
      ? copy.hiddenNotice
      : state === 'playing'
        ? ''
        : reducedMotion && !startedByUserRef.current
          ? copy.reducedNotice
          : copy.pausedNotice;

  const unsafe =
    flashesPerSecond !== null &&
    flashesPerSecond !== undefined &&
    !isSafeFlashRate(flashesPerSecond);

  return (
    <div
      className={`a11ytb-safe-motion ${className}`.trim()}
      data-a11ytb-exclude=""
      data-a11ytb-safe-motion={state}
    >
      {caption ? (
        <p className="a11ytb-safe-motion__caption" id={captionId}>
          {caption}
        </p>
      ) : null}
      {description ? <p className="a11ytb-safe-motion__caption">{description}</p> : null}

      <div className="a11ytb-safe-motion__frame" hidden={state === 'hidden'} key={resetKey}>
        {children}
      </div>

      <div className="a11ytb-safe-motion__controls" role="group" aria-label={copy.controlsLabel}>
        {allowPause ? (
          state === 'playing' ? (
            <button type="button" className="a11ytb-safe-motion__button" onClick={pause}>
              {copy.pause}
            </button>
          ) : (
            <button type="button" className="a11ytb-safe-motion__button" onClick={start}>
              {copy.play}
            </button>
          )
        ) : null}

        {allowStop ? (
          <button type="button" className="a11ytb-safe-motion__button" onClick={stop}>
            {copy.stop}
          </button>
        ) : null}

        {allowHide ? (
          state === 'hidden' ? (
            <button type="button" className="a11ytb-safe-motion__button" onClick={show}>
              {copy.show}
            </button>
          ) : (
            <button type="button" className="a11ytb-safe-motion__button" onClick={hide}>
              {copy.hide}
            </button>
          )
        ) : null}
      </div>

      {notice ? (
        <p className="a11ytb-safe-motion__notice" role="status">
          {notice}
        </p>
      ) : null}

      {unsafe ? <p className="a11ytb-safe-motion__notice">{copy.unsafeWarning}</p> : null}
    </div>
  );
}
