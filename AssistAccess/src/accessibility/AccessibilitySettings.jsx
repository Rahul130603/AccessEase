import React, { useCallback, useId, useMemo } from 'react';

import { VISUAL_RANGES } from './core/settingsSchema.js';
import { getProfiles, resolveActiveProfile } from './core/profiles/profiles.js';
import { useConfirm } from './core/confirm/ConfirmContext.jsx';
import { useA11ySettings } from './core/SettingsContext.jsx';
import { formatMessage } from './strings.js';
import Icon from './ui/icons.jsx';
import SliderControl from './ui/SliderControl.jsx';
import Switch from './ui/Switch.jsx';

/**
 * Quick settings — the controls a person reaches for first, at the top of the widget.
 *
 * Every control here is wired to the same shared store the detailed feature sections
 * use, so:
 *  - a slider moved here updates the page immediately and is reflected in the
 *    detailed panel (and the other way round), because there is one source of truth;
 *  - preferences are saved by the ordinary debounced persistence path;
 *  - a profile pressed here applies exactly the same patch the profiles section does.
 * Nothing in this component is decorative: each control reads and writes a real
 * setting, and each is a native control (switch button, range input, checkbox-free
 * toggle group) with a visible focus indicator.
 */
export default function AccessibilitySettings() {
  const { settings, actions, meta, config, strings } = useA11ySettings();
  const confirm = useConfirm();
  const copy = strings.widget;
  // One per-instance prefix for the group headings these controls are labelled by.
  const instanceId = useId().replace(/:/g, '');
  const headingIds = {
    profiles: `a11ytb-quick-profiles-${instanceId}`,
    motion: `a11ytb-quick-motion-${instanceId}`,
    visual: `a11ytb-quick-visual-${instanceId}`,
    actions: `a11ytb-quick-actions-${instanceId}`,
  };

  const profiles = useMemo(() => getProfiles({ config, settings }), [config, settings]);
  const active = useMemo(() => resolveActiveProfile(settings, profiles), [settings, profiles]);
  // Keep the row compact: the built-ins first, then whatever the app or user added.
  const chips = profiles.slice(0, 5);

  const savedText = meta.lastSavedAt
    ? formatMessage(copy.savedAt, { time: new Date(meta.lastSavedAt).toLocaleTimeString() })
    : copy.notSavedYet;

  const resetEverything = useCallback(async () => {
    const accepted = await confirm({
      title: formatMessage(strings.reset.confirmTitle, { scope: strings.reset.scopeLabels.all }),
      description: formatMessage(strings.reset.confirmDescription, {
        seconds: Math.round(15000 / 1000),
      }),
      confirmLabel: strings.reset.confirmButton,
      cancelLabel: strings.confirm.dialogCancel,
      destructive: true,
    });
    if (accepted) actions.resetScope('all');
  }, [confirm, actions, strings]);

  return (
    <div className="a11ytb-quick">
      {/* ── Profiles ─────────────────────────────────────────────────────── */}
      <h3 className="a11ytb-quick__heading" id={headingIds.profiles}>
        {copy.profilesLabel}
      </h3>
      <div className="a11ytb-quick__profiles" role="group" aria-labelledby={headingIds.profiles}>
        {chips.map((profile) => {
          const pressed = !active.isCustom && active.id === profile.id;
          return (
            <button
              type="button"
              key={profile.id}
              className="a11ytb-quick__profile"
              aria-pressed={pressed}
              onClick={() => actions.applyProfile(profile)}
            >
              <span className="a11ytb-quick__profile-tick" aria-hidden="true">
                ✓
              </span>
              {profile.label}
            </button>
          );
        })}
        {active.isCustom ? <span className="a11ytb-quick__custom">{copy.customProfile}</span> : null}
      </div>

      {/* ── Motion ───────────────────────────────────────────────────────── */}
      <h3 className="a11ytb-quick__heading" id={headingIds.motion}>
        {copy.motionLabel}
      </h3>
      <div role="group" aria-labelledby={headingIds.motion}>
        <Switch
          label={strings.motion.reduceMotionLabel}
          description={
            settings.motion.reduceMotion === 'system'
              ? meta.osReducedMotion
                ? strings.motion.reduceMotionOn
                : strings.motion.reduceMotionOff
              : strings.motion.reduceMotionHint
          }
          checked={meta.effectiveReducedMotion}
          onChange={(next) => actions.setMotion('reduceMotion', next ? 'on' : 'off')}
        />
        <Switch
          label={strings.motion.pauseAnimationsLabel}
          description={strings.motion.pauseAnimationsHint}
          checked={settings.motion.pauseAnimations}
          onChange={(next) => actions.setMotion('pauseAnimations', next)}
        />
      </div>

      {/* ── Display ──────────────────────────────────────────────────────── */}
      <h3 className="a11ytb-quick__heading" id={headingIds.visual}>
        {copy.visualLabel}
      </h3>
      <div role="group" aria-labelledby={headingIds.visual}>
        <SliderControl
          label={strings.visuals.brightnessLabel}
          value={settings.visual.brightness}
          min={VISUAL_RANGES.brightness.min}
          max={VISUAL_RANGES.brightness.max}
          step={VISUAL_RANGES.brightness.step}
          onChange={(value) => actions.setVisualValues({ brightness: value })}
          formatValue={(value) => `${value}%`}
          formatValueText={(value) => formatMessage(strings.visuals.percentValue, { value })}
        />
        <SliderControl
          label={strings.visuals.contrastLabel}
          value={settings.visual.contrast}
          min={VISUAL_RANGES.contrast.min}
          max={VISUAL_RANGES.contrast.max}
          step={VISUAL_RANGES.contrast.step}
          onChange={(value) => actions.setVisualValues({ contrast: value })}
          formatValue={(value) => `${value}%`}
          formatValueText={(value) => formatMessage(strings.visuals.percentValue, { value })}
        />
        <SliderControl
          label={strings.visuals.saturationLabel}
          value={settings.visual.saturation}
          min={VISUAL_RANGES.saturation.min}
          max={VISUAL_RANGES.saturation.max}
          step={VISUAL_RANGES.saturation.step}
          onChange={(value) => actions.setVisualValues({ saturation: value })}
          formatValue={(value) => `${value}%`}
          formatValueText={(value) => formatMessage(strings.visuals.percentValue, { value })}
        />
      </div>

      {/* ── Preferences ──────────────────────────────────────────────────── */}
      <h3 className="a11ytb-quick__heading" id={headingIds.actions}>
        {copy.actionsLabel}
      </h3>
      <div className="a11ytb-quick__actions" role="group" aria-labelledby={headingIds.actions}>
        <button type="button" className="a11ytb-button" onClick={() => actions.saveNow()}>
          <Icon name="preferences" />
          {copy.saveNow}
        </button>
        <button type="button" className="a11ytb-button" onClick={resetEverything}>
          <Icon name="reset" />
          {copy.resetAll}
        </button>
      </div>
      <p className="a11ytb-hint">{savedText}</p>
    </div>
  );
}
