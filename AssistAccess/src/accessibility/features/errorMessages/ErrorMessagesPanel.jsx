import React, { useMemo } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import Switch from '../../ui/Switch.jsx';
import FindingList from '../screenReader/FindingList.jsx';

/**
 * Feature: accessible error messages.
 *
 * The panel has three parts: the components and how they wire a message to a field,
 * the audit findings for error messages on this page, and the user's choice about
 * announcing errors a second time.
 *
 * The last one is the interesting one. By default the module focuses the error
 * summary (or the field) and does *not* announce, because a focused element is read
 * out anyway — announcing as well is exactly how forms end up saying everything
 * twice. The switch exists for forms that genuinely cannot move focus.
 */
export default function ErrorMessagesPanel() {
  const { settings, actions, strings } = useA11ySettings();
  const audit = useAudit();
  const copy = strings.errors;

  const findings = useMemo(
    () => (audit ? audit.findings.filter((finding) => finding.checkId === 'form-errors') : []),
    [audit],
  );

  const counters = (audit && audit.counters) || {};

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <Switch
        label={copy.announceLabel}
        description={copy.announceHint}
        checked={settings.forms.announceErrors === true}
        onChange={(next) => actions.setForms('announceErrors', next)}
      />

      <h4 className="a11ytb-note__heading">{copy.componentHeading}</h4>
      <p className="a11ytb-hint">{copy.componentIntro}</p>
      <pre className="a11ytb-code">
        <code>{copy.summaryCode}</code>
      </pre>

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">{copy.summaryHeading} — rendered markup</summary>
        <pre className="a11ytb-code">
          <code>{copy.fieldCode}</code>
        </pre>
      </details>

      <h4 className="a11ytb-note__heading">{copy.guidanceHeading}</h4>
      <ul className="a11ytb-uninspectable">
        {copy.guidance.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h4 className="a11ytb-note__heading">{copy.auditHeading}</h4>
      <ul className="a11ytb-uninspectable">
        <li>
          {strings.audit.counterLabels.invalidMarked}: <strong>{counters.invalidMarked || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.invalidWithoutMessage}:{' '}
          <strong>{counters.invalidWithoutMessage || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.unassociatedErrors}:{' '}
          <strong>{counters.unassociatedErrors || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.invalidNotMarked}:{' '}
          <strong>{counters.invalidNotMarked || 0}</strong>
        </li>
      </ul>
      <FindingList findings={findings} emptyMessage={strings.audit.detectedEmpty} />
    </div>
  );
}
