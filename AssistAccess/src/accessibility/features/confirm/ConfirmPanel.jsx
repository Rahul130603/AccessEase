import React, { useState } from 'react';

import { useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import { useAnnounce, useA11ySettings } from '../../core/SettingsContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';

/**
 * Feature: confirmation before important actions.
 *
 * The panel documents when a confirmation is worth interrupting someone for (and
 * when it is not), shows how to call the service, and includes a working demo so the
 * keyboard and screen reader behaviour can be tested without touching real data.
 *
 * The demo announces its result through the shared service and shows the same text
 * in a plain paragraph with no live region, so the message is spoken once — the same
 * one-channel rule the module applies everywhere else.
 */
export default function ConfirmPanel() {
  const { strings } = useA11ySettings();
  const confirm = useConfirm();
  const announce = useAnnounce();
  const copy = strings.confirm;
  const example = getFixExample('confirm-dialog');

  const [deleted, setDeleted] = useState(false);

  const runDemo = async () => {
    const accepted = await confirm({
      title: `Delete ${copy.demoItem}?`,
      description: copy.demoIntro,
      details: [
        'Nothing in this demo is real',
        'The button becomes unavailable afterwards',
        'Focus returns to this button when the dialog closes',
      ],
      confirmLabel: copy.demoButton,
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!accepted) return;
    setDeleted(true);
    announce(copy.demoDone, { level: 'standard', source: 'confirm-demo' });
  };

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <h4 className="a11ytb-note__heading">{copy.whenHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.when.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <ul className="a11ytb-uninspectable">
        {copy.whenNot.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.codeHeading}</h4>
      <pre className="a11ytb-code">
        <code>{copy.code}</code>
      </pre>
      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">Review step for legal, financial or data submissions</summary>
        <pre className="a11ytb-code">
          <code>{copy.reviewCode}</code>
        </pre>
      </details>

      <h4 className="a11ytb-note__heading">{copy.demoHeading}</h4>
      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={runDemo} disabled={deleted}>
          {copy.demoButton}
        </button>
      </div>
      {deleted ? <p className="a11ytb-status">{copy.demoItemGone}</p> : null}

      <h4 className="a11ytb-note__heading">{copy.guidanceHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.guidance.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

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
