import React, { useCallback, useEffect, useState } from 'react';

import { useAnnounce, useA11ySettings } from '../../core/SettingsContext.jsx';
import {
  clearAnnouncementLog,
  getAnnouncementLog,
  subscribeAnnouncements,
} from '../../core/a11y/announcer.js';
import { getFixExample } from '../../core/audit/fixExamples.js';
import Switch from '../../ui/Switch.jsx';

/**
 * Feature: screen reader status announcements.
 *
 * Three things live here:
 *  1. the verbosity setting, which gates every announcement the toolbar makes
 *     through the shared service (critical / standard / verbose),
 *  2. the navigation-change announcement and the audit highlight toggle, and
 *  3. a log of what was actually announced — including the messages that were
 *     *dropped* as duplicates or by verbosity. The log exists so "we avoid
 *     duplicate announcements" is something the user can verify rather than
 *     something the toolbar asserts.
 *
 * The log is data, not an announcement: it has no live region, so reading it never
 * triggers speech.
 */

function useAnnouncementLog() {
  const [log, setLog] = useState(() => getAnnouncementLog());
  useEffect(() => subscribeAnnouncements(setLog), []);
  return log;
}

export default function AnnouncementsPanel() {
  const { settings, actions, strings } = useA11ySettings();
  const announce = useAnnounce();
  const copy = strings.status;
  const reader = settings.reader;
  const log = useAnnouncementLog();
  const example = getFixExample('status-message');

  const verbosityRadioName = 'a11ytb-verbosity';

  const setVerbosity = useCallback(
    (value) => {
      actions.setReader('announceVerbosity', value);
    },
    [actions],
  );

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <fieldset className="a11ytb-fieldset">
        <legend className="a11ytb-legend">{copy.verbosityLegend}</legend>
        {[
          { value: 'minimal', label: copy.verbosityMinimal },
          { value: 'standard', label: copy.verbosityStandard },
          { value: 'verbose', label: copy.verbosityVerbose },
        ].map((option) => (
          <label className="a11ytb-choice" key={option.value}>
            <input
              type="radio"
              name={verbosityRadioName}
              value={option.value}
              checked={reader.announceVerbosity === option.value}
              onChange={() => setVerbosity(option.value)}
            />
            <span className="a11ytb-choice__text">
              <span className="a11ytb-choice__label">{option.label}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Switch
        label={copy.routeLabel}
        description={copy.routeHint}
        checked={reader.announceRouteChanges !== false}
        onChange={(next) => actions.setReader('announceRouteChanges', next)}
      />

      <Switch
        label={copy.highlightLabel}
        description={copy.highlightHint}
        checked={reader.highlightOnJump !== false}
        onChange={(next) => actions.setReader('highlightOnJump', next)}
      />

      <div className="a11ytb-button-row">
        <button
          type="button"
          className="a11ytb-button"
          onClick={() => announce(copy.previewMessage, { level: 'critical', source: 'preview' })}
        >
          {copy.preview}
        </button>
        <button type="button" className="a11ytb-button" onClick={() => clearAnnouncementLog()}>
          {copy.logClear}
        </button>
      </div>

      <h4 className="a11ytb-note__heading">{copy.logHeading}</h4>
      {log.length === 0 ? (
        <p className="a11ytb-hint">{copy.logEmpty}</p>
      ) : (
        <ol className="a11ytb-log">
          {log.map((entry) => (
            <li className="a11ytb-log__item" key={entry.id}>
              <span className="a11ytb-band a11ytb-band--unverified">
                {entry.politeness === 'assertive' ? copy.logPolitenessAssertive : copy.logPolitenessPolite}
              </span>
              <span className="a11ytb-log__text">{entry.message}</span>
              <span className="a11ytb-hint">
                {entry.suppressed === 'duplicate'
                  ? copy.logSuppressedDuplicate
                  : entry.suppressed === 'verbosity'
                    ? copy.logSuppressedVerbosity
                    : entry.source}
              </span>
            </li>
          ))}
        </ol>
      )}

      <h4 className="a11ytb-note__heading">{copy.guidanceHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.guidance.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <pre className="a11ytb-code">
        <code>{copy.componentCode}</code>
      </pre>

      {example ? (
        <details className="a11ytb-details">
          <summary className="a11ytb-details__summary">{example.title}</summary>
          <pre className="a11ytb-code">
            <code>{example.code}</code>
          </pre>
          <ul className="a11ytb-uninspectable">
            {example.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
