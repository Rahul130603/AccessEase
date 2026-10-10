import React, { useId } from 'react';

import { useA11ySettings } from '../../core/SettingsContext.jsx';
import Switch from '../../ui/Switch.jsx';

/**
 * Motion controls: reduced-motion toggle, animation handling strategy, a
 * "pause everything now" switch and autoplaying-media control.
 *
 * Relationship with the operating system setting
 * ----------------------------------------------
 * The switch shows the *effective* state (OS preference unless the user overrode
 * it). Toggling it writes an explicit `on`/`off`, which is announced; the
 * "Use my system setting" button returns control to the OS. The toolbar never
 * silently overrides the OS, and it never silently follows it once the user has
 * made an explicit choice.
 */
export default function MotionControls() {
  const { settings, actions, meta, strings } = useA11ySettings();
  const copy = strings.motion;
  const motion = settings.motion;

  const strategyId = useId();
  const strategyHintId = useId();

  const followingSystem = motion.reduceMotion === 'system';
  const systemStateText = meta.osReducedMotion ? copy.reduceMotionOn : copy.reduceMotionOff;

  return (
    <div className="a11ytb-feature">
      <Switch
        label={copy.reduceMotionLabel}
        description={followingSystem ? systemStateText : copy.reduceMotionHint}
        checked={meta.effectiveReducedMotion}
        onChange={(next) => actions.setMotion('reduceMotion', next ? 'on' : 'off')}
      />

      {followingSystem ? null : (
        <div className="a11ytb-button-row">
          <button
            type="button"
            className="a11ytb-button"
            onClick={() => actions.setMotion('reduceMotion', 'system')}
          >
            {copy.useSystem}
          </button>
        </div>
      )}

      <div className="a11ytb-field">
        <label className="a11ytb-field__label" htmlFor={strategyId}>
          {copy.strategyLabel}
        </label>
        <select
          className="a11ytb-select"
          id={strategyId}
          value={motion.motionStrategy}
          aria-describedby={strategyHintId}
          onChange={(event) => actions.setMotion('motionStrategy', event.target.value)}
        >
          <option value="instant">{copy.strategyInstant}</option>
          <option value="pause">{copy.strategyPause}</option>
        </select>
        <p className="a11ytb-hint" id={strategyHintId}>
          {copy.strategyHint} {copy.strategyUsedWhenReduced}
        </p>
      </div>

      <Switch
        label={copy.pauseAnimationsLabel}
        description={copy.pauseAnimationsHint}
        checked={motion.pauseAnimations}
        onChange={(next) => actions.setMotion('pauseAnimations', next)}
      />

      <Switch
        label={copy.pauseMediaLabel}
        description={copy.pauseMediaHint}
        checked={motion.pauseAutoMedia}
        onChange={(next) => actions.setMotion('pauseAutoMedia', next)}
      />
    </div>
  );
}
