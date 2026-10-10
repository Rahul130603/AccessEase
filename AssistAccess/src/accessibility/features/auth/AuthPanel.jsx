import React, { useMemo } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import FindingList from '../screenReader/FindingList.jsx';

/**
 * Feature: accessible authentication.
 *
 * This panel is deliberately mostly prose and examples, because that is the honest
 * shape of the feature: authentication belongs to the site that owns the login, and
 * a toolbar cannot repair it. What the module contributes is
 *   - an audit of the credential fields on *this* page (missing autocomplete values,
 *     autocomplete="off", inline paste blockers, signals of a memory test),
 *   - the example forms that get the markup right, and
 *   - an explicit statement of what the toolbar will not do: it never signs in,
 *     never fills a credential, never removes a site's handlers, and never stores a
 *     password, code or token anywhere.
 */
export default function AuthPanel() {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const copy = strings.auth;

  const findings = useMemo(
    () => (audit ? audit.findings.filter((finding) => finding.checkId === 'auth-fields') : []),
    [audit],
  );
  const counters = (audit && audit.counters) || {};
  const autocompleteExample = getFixExample('auth-autocomplete');
  const alternativesExample = getFixExample('auth-alternatives');
  const mfaExample = getFixExample('auth-mfa');
  const pasteExample = getFixExample('auth-paste');

  const examples = [autocompleteExample, pasteExample, alternativesExample, mfaExample].filter(Boolean);

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{copy.boundaryHeading}</h4>
        <ul>
          {copy.boundary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <h4 className="a11ytb-note__heading">{copy.autocompleteHeading}</h4>
      <p className="a11ytb-hint">{copy.autocompleteIntro}</p>
      <ul className="a11ytb-uninspectable">
        {copy.autocompleteRows.map((row) => (
          <li key={row.situation}>
            {row.situation}: <code>{row.value}</code> — {row.why}
          </li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.privacyHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.privacy.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.recoveryHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.recovery.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.examplesHeading}</h4>
      <p className="a11ytb-hint">{copy.examplesIntro}</p>
      <pre className="a11ytb-code">
        <code>{copy.code}</code>
      </pre>

      {examples.map((example) => (
        <details className="a11ytb-details" key={example.title}>
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
      ))}

      <h4 className="a11ytb-note__heading">{copy.auditHeading}</h4>
      <ul className="a11ytb-uninspectable">
        <li>
          {strings.audit.counterLabels.authFields}: <strong>{counters.authFields || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.passwordFields}: <strong>{counters.passwordFields || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.missingAutocomplete}:{' '}
          <strong>{counters.missingAutocomplete || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.pasteBlocked}: <strong>{counters.pasteBlocked || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.cognitiveSignals}:{' '}
          <strong>{counters.cognitiveSignals || 0}</strong>
        </li>
      </ul>
      <FindingList findings={findings} emptyMessage={strings.audit.detectedEmpty} />
    </div>
  );
}
