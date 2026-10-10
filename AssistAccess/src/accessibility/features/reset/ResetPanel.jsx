import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RESET_SCOPES, RESET_UNDO_WINDOW_MS } from '../../constants.js';
import { useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { createDefaultSettings } from '../../core/settingsSchema.js';
import { formatMessage } from '../../strings.js';

/**
 * Feature: reset accessibility settings.
 *
 * Two behaviours make a reset safe rather than frightening:
 *  - it is confirmed first, with the scope named in the dialog;
 *  - one step can be undone, for a limited time, and the announcement says how long.
 *
 * The reset is applied through the ordinary settings pipeline, so the page updates
 * immediately, the change is persisted like any other, and every feature that reads
 * the store (visual filters, motion overrides, audit, forms defaults) reacts at once.
 * No reload, and no special-case code per feature.
 */

/** Flat "path: value" list of the default configuration, for the panel to show. */
function describeDefaults(settings) {
  const lines = [];
  const walk = (value, path) => {
    if (value === null || typeof value !== 'object') {
      lines.push(`${path}: ${String(value)}`);
      return;
    }
    if (Array.isArray(value)) {
      lines.push(`${path}: ${value.length === 0 ? 'none' : `${value.length} entr${value.length === 1 ? 'y' : 'ies'}`}`);
      return;
    }
    Object.keys(value).forEach((key) => walk(value[key], path ? `${path}.${key}` : key));
  };
  ['visual', 'motion', 'reader', 'forms', 'ui'].forEach((group) => walk(settings[group], group));
  return lines;
}

export default function ResetPanel() {
  const { actions, meta, strings } = useA11ySettings();
  const confirm = useConfirm();
  const copy = strings.reset;

  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState('');
  const [undoAvailable, setUndoAvailable] = useState(false);
  const undoTimerRef = useRef(null);
  const undoSeconds = Math.round(RESET_UNDO_WINDOW_MS / 1000);

  const defaults = useMemo(() => describeDefaults(createDefaultSettings()), []);
  const scopeLabel = copy.scopeLabels[scope] || scope;

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
    [],
  );

  const doReset = useCallback(async () => {
    const accepted = await confirm({
      title: formatMessage(copy.confirmTitle, { scope: scopeLabel }),
      description: formatMessage(copy.confirmDescription, { seconds: undoSeconds }),
      details: [
        copy.scopeDescriptions[scope] || '',
        ...copy.keeps.slice(0, 2),
      ].filter(Boolean),
      confirmLabel: copy.confirmButton,
      cancelLabel: strings.confirm.dialogCancel,
      destructive: true,
    });
    if (!accepted) return;
    actions.resetScope(scope);
    setStatus(formatMessage(copy.undoHint, { seconds: undoSeconds }));
    setUndoAvailable(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null;
      setUndoAvailable(false);
      setStatus(copy.undoExpired);
    }, RESET_UNDO_WINDOW_MS);
  }, [confirm, scopeLabel, undoSeconds, actions, scope, copy, strings]);

  const doUndo = useCallback(() => {
    const undone = actions.undoReset();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoAvailable(false);
    setStatus(undone ? copy.restoreDone : copy.undoExpired);
  }, [actions, copy]);

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <fieldset className="a11ytb-fieldset">
        <legend className="a11ytb-legend">{copy.scopeLegend}</legend>
        {RESET_SCOPES.map((value) => (
          <label className="a11ytb-choice" key={value}>
            <input
              type="radio"
              name="a11ytb-reset-scope"
              value={value}
              checked={scope === value}
              onChange={() => setScope(value)}
            />
            <span className="a11ytb-choice__text">
              <span className="a11ytb-choice__label">{copy.scopeLabels[value]}</span>
              <span className="a11ytb-hint">{copy.scopeDescriptions[value]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={doReset}>
          {copy.button}
        </button>
        {undoAvailable ? (
          <button type="button" className="a11ytb-button" onClick={doUndo}>
            {copy.undo}
          </button>
        ) : null}
      </div>

      <p className="a11ytb-status" role="status">
        {status}
      </p>

      <h4 className="a11ytb-note__heading">{copy.keepsHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.keeps.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="a11ytb-hint">{copy.profilesNote}</p>

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">{copy.defaultsHeading}</summary>
        <p className="a11ytb-hint">{copy.defaultsIntro}</p>
        <ul className="a11ytb-uninspectable">
          {defaults.map((line) => (
            <li key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ul>
      </details>

      <p className="a11ytb-hint">
        {meta.storageMode === 'memory'
          ? strings.preferences.modeMemory
          : formatMessage(strings.preferences.savedAt, {
              time: meta.lastSavedAt ? new Date(meta.lastSavedAt).toLocaleTimeString() : '—',
            })}
      </p>
    </div>
  );
}
