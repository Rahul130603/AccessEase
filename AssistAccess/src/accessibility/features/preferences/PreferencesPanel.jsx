import React, { useId, useMemo, useRef, useState } from 'react';

import { buildExportPayload, readFileText, serializeExport } from '../../core/preferencesIO.js';
import { useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';

/**
 * Feature: save accessibility preferences.
 *
 * The persistence itself lives in core/storage.js + core/SettingsContext.jsx and has
 * been in place since the first phase. What this panel adds is the part that makes it
 * trustworthy: an honest account of *where* the settings live, *what* they contain,
 * what happens when the browser refuses to store them, and a way to move them.
 *
 * Deliberate points of honesty:
 *  - The storage mode is shown as it really is (localStorage, session-only, or memory
 *    only when the browser blocks storage), not as "saved" in every case.
 *  - The exact payload can be read in the panel, so the statement "no passwords, no
 *    form values" is verifiable rather than asserted.
 *  - Export exists because localStorage is per browser and per device; an imported
 *    file is treated as untrusted input and clamped before anything is applied.
 */
export default function PreferencesPanel() {
  const { settings, actions, meta, strings } = useA11ySettings();
  const confirm = useConfirm();
  const copy = strings.preferences;

  const [showPayload, setShowPayload] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importWarnings, setImportWarnings] = useState([]);
  const [exportFallback, setExportFallback] = useState('');
  const fileInputRef = useRef(null);
  // Per-instance ids: two mounted widgets must not share label/input associations.
  const instanceId = useId().replace(/:/g, '');
  const payloadFieldId = `a11ytb-settings-payload-${instanceId}`;
  const fallbackFieldId = `a11ytb-export-fallback-${instanceId}`;
  const importFieldId = `a11ytb-import-file-${instanceId}`;

  const payloadText = useMemo(
    () => serializeExport(buildExportPayload(settings, { apiVersion: meta.apiVersion })),
    [settings, meta.apiVersion],
  );

  const storageText =
    meta.storageMode === 'local'
      ? copy.modeLocal
      : meta.storageMode === 'session'
        ? copy.modeSession
        : copy.modeMemory;

  const savedText = meta.lastSavedAt
    ? formatMessage(copy.savedAt, { time: new Date(meta.lastSavedAt).toLocaleTimeString() })
    : copy.neverSaved;

  const handleExport = () => {
    const result = actions.exportPreferences();
    setExportFallback(result.ok ? '' : result.text);
  };

  const handleImport = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setImportMessage('');
    setImportWarnings([]);
    try {
      const text = await readFileText(file);
      const parsed = actions.importPreferences(text);
      if (!parsed.ok) {
        setImportMessage(
          formatMessage(strings.announcements.importFailed, {
            reason: copy.importErrors[parsed.error] || parsed.error || 'unknown',
          }),
        );
      } else {
        setImportWarnings(parsed.warnings || []);
      }
    } catch (error) {
      const reason = copy.importErrors[error.message] || error.message;
      setImportMessage(formatMessage(strings.announcements.importFailed, { reason }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    const accepted = await confirm({
      title: strings.reset.deleteHeading,
      description: copy.deleteHint,
      details: [copy.modeMemory, copy.caveats[0]],
      confirmLabel: copy.deleteLabel,
      destructive: true,
    });
    if (accepted) actions.deleteStoredPreferences();
  };

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <h4 className="a11ytb-note__heading">{copy.storageHeading}</h4>
      <p className="a11ytb-status" role="status">
        {storageText}
      </p>
      <ul className="a11ytb-uninspectable">
        <li>
          {savedText}
          {meta.storageError ? ` ${copy.saveError}` : ''}
        </li>
        {meta.storageKey ? (
          <li>
            {copy.keyLabel}: <code>{meta.storageKey}</code>
          </li>
        ) : null}
      </ul>

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={() => actions.saveNow()}>
          {copy.saveNow}
        </button>
      </div>

      <h4 className="a11ytb-note__heading">{copy.caveatsHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.caveats.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.contentHeading}</h4>
      <p className="a11ytb-hint">{copy.contentIntro}</p>
      <details
        className="a11ytb-details"
        onToggle={(event) => setShowPayload(event.currentTarget.open)}
      >
        <summary className="a11ytb-details__summary">{copy.showPayload}</summary>
        {showPayload ? (
          <>
            <label className="a11ytb-field__label" htmlFor={payloadFieldId}>
              {copy.payloadLabel}
            </label>
            <textarea
              className="a11ytb-report"
              id={payloadFieldId}
              readOnly
              rows={12}
              value={payloadText}
            />
          </>
        ) : null}
      </details>

      <h4 className="a11ytb-note__heading">{copy.notStoredHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.notStored.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.transferHeading}</h4>
      <p className="a11ytb-hint">{copy.transferIntro}</p>
      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={handleExport}>
          {copy.exportLabel}
        </button>
      </div>
      {exportFallback ? (
        <>
          <p className="a11ytb-status">{copy.exportBlocked}</p>
          <label className="a11ytb-field__label" htmlFor={fallbackFieldId}>
            {copy.payloadLabel}
          </label>
          <textarea
            className="a11ytb-report"
            id={fallbackFieldId}
            readOnly
            rows={8}
            value={exportFallback}
          />
        </>
      ) : null}

      <div className="a11ytb-field">
        <label className="a11ytb-field__label" htmlFor={importFieldId}>
          {copy.importLabel}
        </label>
        <p className="a11ytb-hint">{copy.importHint}</p>
        <input
          className="a11ytb-form__control"
          id={importFieldId}
          type="file"
          accept="application/json,.json"
          ref={fileInputRef}
          onChange={handleImport}
        />
      </div>
      {importMessage ? <p className="a11ytb-status">{importMessage}</p> : null}
      {importWarnings.length ? (
        <ul className="a11ytb-uninspectable">
          {importWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{strings.reset.deleteHeading}</h4>
        <p>{copy.deleteHint}</p>
        <div className="a11ytb-button-row">
          <button type="button" className="a11ytb-button" onClick={handleDelete}>
            {copy.deleteLabel}
          </button>
        </div>
      </div>

      <h4 className="a11ytb-note__heading">{copy.apiHeading}</h4>
      <p className="a11ytb-hint">{copy.apiIntro}</p>
      <pre className="a11ytb-code">
        <code>{copy.apiCode}</code>
      </pre>
    </div>
  );
}
