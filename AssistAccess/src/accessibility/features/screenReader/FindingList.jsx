import React, { useState } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';
import { CERTAINTY } from '../../core/audit/findings.js';
import { useAnnounce, useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';

const SEVERITY_COPY = {
  error: 'severityError',
  warning: 'severityWarning',
  info: 'severityInfo',
};

/**
 * Renders a list of audit findings.
 *
 * Accessibility decisions worth noting:
 *  - The list is a real `<ul>`/`<li>` list, so a screen reader can say how many
 *    findings there are and let the user step through them.
 *  - Severity and certainty are shown as text ("Detected problem", "Needs a
 *    decision"), never as colour alone.
 *  - The fix example uses the native `<details>`/`<summary>` disclosure: no ARIA,
 *    no focus management, correct semantics for free.
 *  - "Show me where" scrolls and outlines the element but deliberately does **not**
 *    move focus into the page. Moving focus can trigger the page's own handlers and
 *    change what the user is looking at. "Move focus there" is a separate, explicit
 *    action, and it is only offered when the element is genuinely focusable.
 *  - The status line is plain text without a live region: the announcement goes
 *    through the shared service, so the message is never spoken twice.
 */
export default function FindingList({ findings, emptyMessage, className = '', compact=false }) {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const announce = useAnnounce();
  const copy = strings.audit;
  const [status, setStatus] = useState('');

  if (!findings || findings.length === 0) {
    return <p className="a11ytb-hint">{emptyMessage}</p>;
  }

  const show = (finding, focus) => {
    const ok = audit ? audit.jump(finding.id, { focus }) : false;
    if (!ok) {
      setStatus(copy.jumpFailed);
      announce(copy.jumpFailed, { level: 'critical', source: 'audit', dedupeKey: 'audit.jump' });
      return;
    }
    const message = formatMessage(focus ? copy.jumpedFocus : copy.jumped, { label: finding.label });
    setStatus(message);
    announce(message, {
      level: 'standard',
      source: 'audit',
      dedupeKey: `audit.jump.${finding.id}`,
    });
  };

  return (
    <div className={className}>
      <ul className="a11ytb-findings">
        {findings.map((finding) => {
          const example = getFixExample(finding.fixExampleId);
          const isReview = finding.certainty === CERTAINTY.REVIEW;
          return (
            <li className="a11ytb-finding" key={finding.id}>
              <div className="a11ytb-finding__head">
                <span className={`a11ytb-band a11ytb-band--${finding.severity}`}>
                  {copy[SEVERITY_COPY[finding.severity]] || finding.severity}
                </span>
                <span className="a11ytb-finding__label">{finding.label}</span>
                {isReview ? (
                  <span className="a11ytb-band a11ytb-band--unverified">{copy.certaintyReview}</span>
                ) : null}
              </div>

              <p className="a11ytb-finding__message">{finding.message}</p>

              {finding.evidence ? (
                <p className="a11ytb-finding__meta">
                  {copy.evidence}: <span className="a11ytb-evidence">{finding.evidence}</span>
                </p>
              ) : null}

              {finding.why ? (
                <p className="a11ytb-finding__meta">
                  {copy.why}: {finding.why}
                </p>
              ) : null}

              {finding.wcag && finding.wcag.length ? (
                <p className="a11ytb-finding__meta">
                  {copy.wcag}: {finding.wcag.map((item) => `${item.id} (${item.level})`).join(', ')}
                </p>
              ) : null}

              <div className="a11ytb-finding__actions">
                <button
                  type="button"
                  className="a11ytb-button"
                  onClick={() => show(finding, false)}
                  aria-label={`${copy.jump}: ${finding.label}`}
                >
                  {copy.jump}
                </button>
                {finding.focusable ? (
                  <button
                    type="button"
                    className="a11ytb-button"
                    onClick={() => show(finding, true)}
                    aria-label={`${copy.focus}: ${finding.label}`}
                  >
                    {copy.focus}
                  </button>
                ) : null}
              </div>

              {example && !compact ? (
                <details className="a11ytb-details">
                  <summary className="a11ytb-details__summary">{copy.howToFix}</summary>
                  <p className="a11ytb-details__title">{example.title}</p>
                  <pre className="a11ytb-code">
                    <code>{example.code}</code>
                  </pre>
                  {example.notes && example.notes.length ? (
                    <ul className="a11ytb-uninspectable">
                      {example.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>

      {status ? (
        <p className="a11ytb-status" data-a11ytb-audit-status="">
          {status}
        </p>
      ) : null}
    </div>
  );
}
