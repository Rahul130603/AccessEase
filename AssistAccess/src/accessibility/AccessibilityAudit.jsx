import React, { useId } from 'react';

import { useAudit } from './core/audit/AuditContext.jsx';
import { useA11ySettings } from './core/SettingsContext.jsx';
import { formatMessage } from './strings.js';
import FindingList from './features/screenReader/FindingList.jsx';

/**
 * Compact page check, shown near the top of the widget.
 *
 * It is a *summary* of the audit the reader panels already run, not a second scan:
 * `useAudit()` is the shared provider, so opening this section costs nothing extra and
 * cannot disagree with the detailed reports further down. The counts and the first few
 * findings use the same finding objects, so severity wording, evidence and jump
 * behaviour are identical everywhere.
 *
 * The note at the bottom is deliberately blunt, because this is the place where a user
 * is most likely to over-read an automated result: the audit finds structural problems
 * and never claims to judge quality, and it never changes the page.
 */
export default function AccessibilityAudit({ maxFindings = 3 }) {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const copy = strings.widget;
  // Per-instance id, so two mounted widgets cannot share a heading reference.
  const headingId = `a11ytb-quick-check-${useId().replace(/:/g, '')}`;

  if (!audit) return null;

  const summary = audit.summary;
  const top = audit.findings.slice(0, maxFindings);
  const status = audit.ran
    ? formatMessage(strings.audit.statusChecked, {
        time: audit.ranAt ? new Date(audit.ranAt).toLocaleTimeString() : '',
        findings: summary.total,
      })
    : strings.audit.statusNever;

  return (
    <section className="a11ytb-audit-summary" aria-labelledby={headingId}>
      <h3 className="a11ytb-quick__heading" id={headingId}>
        {copy.checkHeading}
      </h3>
      <p className="a11ytb-hint">{status}</p>

      <ul className="a11ytb-audit-summary__counts">
        <li className="a11ytb-audit-summary__count">
          <strong>{summary.error}</strong> {strings.audit.severityError}
        </li>
        <li className="a11ytb-audit-summary__count">
          <strong>{summary.warning}</strong> {strings.audit.severityWarning}
        </li>
        <li className="a11ytb-audit-summary__count">
          <strong>{summary.info}</strong> {strings.audit.severityInfo}
        </li>
        <li className="a11ytb-audit-summary__count">
          <strong>{summary.review}</strong> {strings.audit.certaintyReview}
        </li>
      </ul>

      <FindingList findings={top} emptyMessage={strings.audit.statusClean} />

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={() => audit.rescan()}>
          {copy.checkAgain}
        </button>
      </div>

      <p className="a11ytb-hint">{copy.checkNote}</p>
    </section>
  );
}
