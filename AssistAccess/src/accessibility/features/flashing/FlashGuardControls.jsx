import React, { useId } from 'react';

import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';
import Switch from '../../ui/Switch.jsx';
import useFlashGuard from './useFlashGuard.js';

const KIND_LABELS = {
  animation: 'itemKindAnimation',
  video: 'itemKindVideo',
  audio: 'itemKindAudio',
  'animated-image': 'itemKindGif',
  marquee: 'itemKindMarquee',
  'svg-animation': 'itemKindAnimation',
};

function round1(value) {
  return value === null || value === undefined ? null : Math.round(value * 10) / 10;
}

/**
 * Feature 1 — Flashing content protection (controls and findings).
 *
 * The list distinguishes three very different kinds of result, because conflating
 * them would be dishonest:
 *  - measured findings (a real estimate from animation timing and colour values),
 *  - content that can be stopped or hidden but never measured (video, animated
 *    images, marquees, SVG animation),
 *  - content that cannot be inspected at all (canvas, third-party embeds).
 */
export default function FlashGuardControls({compact=false, hideSwitch=false}) {
  const { settings, actions, strings } = useA11ySettings();
  const copy = strings.flashing;
  const guard = useFlashGuard();

  const actionId = useId();
  const actionHintId = useId();

  const statusTime = guard.scannedAt ? new Date(guard.scannedAt).toLocaleTimeString() : '';
  const statusText = !guard.scannedAt
    ? copy.statusScanning
    : formatMessage(copy.statusChecked, { time: statusTime, checked: guard.checked });

  const appliedCount = guard.pausedCount + guard.hiddenCount;
  const bandLabel = (band) =>
    band === 'hazard' ? copy.bandHazard : band === 'caution' ? copy.bandCaution : copy.bandUnverified;

  return (
    <div className="a11ytb-feature">
      {!hideSwitch && <Switch
        label={copy.guardLabel}
        description={compact ? undefined : copy.guardHint}
        checked={guard.enabled}
        onChange={(next) => actions.setFlashGuard('enabled', next)}
      />}

      {!compact && <p className="a11ytb-note a11ytb-note--warning">{strings.limits.shortFlashing}</p>}

      {guard.enabled ? (
        <>
          <div className="a11ytb-field">
            <label className="a11ytb-field__label" htmlFor={actionId}>
              {copy.actionLabel}
            </label>
            <select
              className="a11ytb-select"
              id={actionId}
              value={guard.action}
              aria-describedby={compact ? undefined : actionHintId}
              onChange={(event) => actions.setFlashGuard('action', event.target.value)}
            >
              <option value="pause">{copy.actionPause}</option>
              <option value="hide">{copy.actionHide}</option>
              <option value="warn">{copy.actionWarn}</option>
            </select>
            {!compact && <p className="a11ytb-hint" id={actionHintId}>
              {copy.actionHint}
            </p>}
          </div>

          <div className="a11ytb-button-row">
            <button type="button" className="a11ytb-button" onClick={guard.rescan}>
              {copy.rescan}
            </button>
            <button
              type="button"
              className="a11ytb-button"
              onClick={guard.restoreAll}
              disabled={appliedCount === 0}
            >
              {copy.restoreAll}
            </button>
          </div>

          <p className="a11ytb-status" role="status">
            {statusText}
            {appliedCount > 0 ? ` ${formatMessage(copy.statusApplied, { count: appliedCount })}` : ''}
          </p>

          {guard.supported === false ? (
            <p className="a11ytb-note a11ytb-note--warning">{strings.announcements.guardFailed}</p>
          ) : null}

          <h4 className="a11ytb-note__heading">{copy.detectedHeading}</h4>
          {guard.findings.length === 0 ? (
            <p className="a11ytb-hint">{copy.detectedEmpty}</p>
          ) : (
            <ul className="a11ytb-findings">
              {guard.findings.map((finding) => {
                const label = finding.label || copy.itemUnknownTarget;
                return (
                  <li className="a11ytb-finding" key={finding.id}>
                    <div className="a11ytb-finding__head">
                      <span className="a11ytb-finding__label">{label}</span>
                      <span className={`a11ytb-band a11ytb-band--${finding.band}`}>
                        {bandLabel(finding.band)}
                      </span>
                      {finding.applied ? (
                        <span className="a11ytb-band a11ytb-band--unverified">
                          {finding.applied === 'hidden' ? copy.appliedHidden : copy.appliedPaused}
                        </span>
                      ) : null}
                    </div>

                    <p className="a11ytb-finding__meta">{copy[KIND_LABELS[finding.kind] || 'itemKindAnimation']}</p>

                    {finding.measurable ? (
                      <p className="a11ytb-finding__meta">
                        {formatMessage(copy.itemFlashes, { value: round1(finding.flashesPerSecond) })} ·{' '}
                        {formatMessage(copy.itemArea, { value: finding.areaPercent })}
                      </p>
                    ) : null}

                    {finding.redFlashSuspected ? (
                      <p className="a11ytb-finding__meta">{copy.itemRedFlash}</p>
                    ) : null}

                    {finding.measurable ? (
                      <p className="a11ytb-finding__meta">
                        {finding.confidence === 'high' ? copy.confidenceHigh : copy.confidenceLow}
                      </p>
                    ) : null}

                    {finding.note ? <p className="a11ytb-finding__meta">{finding.note}</p> : null}

                    <div className="a11ytb-finding__actions">
                      {finding.applied ? (
                        <button
                          type="button"
                          className="a11ytb-button"
                          aria-label={`${finding.applied === 'hidden' ? copy.actionShowItem : copy.actionResumeItem}: ${label}`}
                          onClick={() => guard.manualAction(finding.id, 'none')}
                        >
                          {finding.applied === 'hidden' ? copy.actionShowItem : copy.actionResumeItem}
                        </button>
                      ) : (
                        <>
                          {finding.canPause ? (
                            <button
                              type="button"
                              className="a11ytb-button"
                              aria-label={`${copy.actionPauseItem}: ${label}`}
                              onClick={() => guard.manualAction(finding.id, 'pause')}
                            >
                              {copy.actionPauseItem}
                            </button>
                          ) : null}
                          {finding.canHide ? (
                            <button
                              type="button"
                              className="a11ytb-button"
                              aria-label={`${copy.actionHideItem}: ${label}`}
                              onClick={() => guard.manualAction(finding.id, 'hide')}
                            >
                              {copy.actionHideItem}
                            </button>
                          ) : null}
                        </>
                      )}

                      {finding.allowed ? (
                        <button
                          type="button"
                          className="a11ytb-button"
                          aria-label={`${copy.unallow}: ${label}`}
                          onClick={() => guard.unallowFinding(finding)}
                        >
                          {copy.unallow}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="a11ytb-button"
                          aria-label={`${copy.allow}: ${label}`}
                          onClick={() => guard.allowFinding(finding)}
                        >
                          {copy.allow}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!compact && <><h4 className="a11ytb-note__heading">{copy.uninspectableHeading}</h4>
          <ul className="a11ytb-uninspectable">
            <li>{copy.uninspectableVideo}</li>
            <li>{copy.uninspectableCanvas}</li>
            <li>{copy.uninspectableEmbed}</li>
            <li>{copy.uninspectableScript}</li>
          </ul></>}
          {guard.uninspectable.length > 0 ? (
            <ul className="a11ytb-uninspectable">
              {guard.uninspectable.map((item) => (
                <li key={`${item.elementKey}-${item.kind}`}>
                  {item.label}: {item.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
