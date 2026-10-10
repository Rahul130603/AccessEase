import React, { useMemo } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import FindingList from '../screenReader/FindingList.jsx';

/**
 * Feature: accessible form labels.
 *
 * Two halves, deliberately kept apart:
 *  - what the audit found on this page (read-only findings, each with the markup
 *    that fixes it), and
 *  - the components the application can use so the problem never exists in the
 *    first place.
 *
 * The toolbar does not add aria-label to another team's inputs. A runtime rename
 * can break their validation messages, their automated tests and their voice-control
 * support, and it hides the real fix.
 */
export default function FormLabelsPanel() {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const copy = strings.formLabels;

  const findings = useMemo(
    () => (audit ? audit.findings.filter((finding) => finding.checkId === 'form-label') : []),
    [audit],
  );
  const counters = (audit && audit.counters) || {};
  const labelExample = getFixExample('form-label-missing');
  const groupExample = getFixExample('form-group-label');

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <ul className="a11ytb-uninspectable">
        <li>
          {strings.audit.counterLabels.controls}: <strong>{counters.controls || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.named}: <strong>{counters.named || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.unnamed}: <strong>{counters.unnamed || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.orphanLabels}: <strong>{counters.orphanLabels || 0}</strong>
        </li>
        <li>
          {strings.audit.counterLabels.groupsWithoutLabel}:{' '}
          <strong>{counters.groupsWithoutLabel || 0}</strong>
        </li>
      </ul>

      <p className="a11ytb-note a11ytb-note--warning">{copy.placeholderNote}</p>
      <p className="a11ytb-hint">{copy.titleNote}</p>

      <h4 className="a11ytb-note__heading">{copy.componentHeading}</h4>
      <p className="a11ytb-hint">{copy.componentIntro}</p>
      <pre className="a11ytb-code">
        <code>{copy.componentCode}</code>
      </pre>

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">{copy.componentHeading} — plain markup</summary>
        {labelExample ? (
          <>
            <p className="a11ytb-details__title">{labelExample.title}</p>
            <pre className="a11ytb-code">
              <code>{labelExample.code}</code>
            </pre>
            <ul className="a11ytb-uninspectable">
              {labelExample.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        ) : null}
        {groupExample ? (
          <>
            <p className="a11ytb-details__title">{groupExample.title}</p>
            <pre className="a11ytb-code">
              <code>{groupExample.code}</code>
            </pre>
            <ul className="a11ytb-uninspectable">
              {groupExample.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        ) : null}
      </details>

      <p className="a11ytb-hint">{copy.focusNote}</p>

      <h4 className="a11ytb-note__heading">{copy.fixHeading}</h4>
      <FindingList findings={findings} emptyMessage={strings.audit.detectedEmpty} />
    </div>
  );
}
