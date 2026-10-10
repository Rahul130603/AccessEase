import React from 'react';

import { getFixExample } from '../../core/audit/fixExamples.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import Switch from '../../ui/Switch.jsx';

/**
 * Feature: show / hide password.
 *
 * The user-facing decision is whether password fields built with the module offer a
 * show/hide control. The rest of the panel documents what the component guarantees
 * and, just as importantly, what the toolbar refuses to do: it does not reach into
 * password fields it did not create.
 */
export default function PasswordPanel() {
  const { settings, actions, strings } = useA11ySettings();
  const copy = strings.password;
  const example = getFixExample('password-toggle');

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <Switch
        label={copy.toggleLabel}
        description={copy.toggleHint}
        checked={settings.forms.passwordToggle !== false}
        onChange={(next) => actions.setForms('passwordToggle', next)}
      />

      <h4 className="a11ytb-note__heading">{copy.codeHeading}</h4>
      <pre className="a11ytb-code">
        <code>{copy.code}</code>
      </pre>

      <h4 className="a11ytb-note__heading">{copy.guaranteesHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.guarantees.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{copy.boundaryHeading}</h4>
        <p>{copy.boundary}</p>
      </div>

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
