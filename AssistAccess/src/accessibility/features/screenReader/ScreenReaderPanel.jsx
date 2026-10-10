import React, { useCallback, useMemo, useState } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { CERTAINTY } from '../../core/audit/findings.js';
import { buildReportText } from '../../core/audit/reportText.js';
import { useAnnounce, useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';
import Switch from '../../ui/Switch.jsx';
import FindingList from './FindingList.jsx';

/**
 * Feature: screen reader compatibility.
 *
 * Scope of the claim, stated in the panel as well as in the code: this panel
 * reports *detectable* structural problems in the page and lists what only a person
 * can judge. The toolbar's own controls are built to the authoring practices, which
 * is a statement about the toolbar — never about the page it is inspecting.
 *
 * The audit is read-only: no attribute is written, no node is wrapped, no text is
 * inserted. Renaming another team's controls from an overlay can break their
 * validation, their tests and their state, so the fix is always handed back to the
 * application as markup (see the fix examples).
 */
export default function ScreenReaderPanel() {
  const { settings, actions, strings } = useA11ySettings();
  const audit = useAudit();
  const announce = useAnnounce();
  const copy = strings.audit;

  const [reportFallback, setReportFallback] = useState('');

  const grouped = useMemo(() => {
    const findings = audit ? audit.findings : [];
    return {
      detected: findings.filter((finding) => finding.certainty !== CERTAINTY.REVIEW),
      review: findings.filter((finding) => finding.certainty === CERTAINTY.REVIEW),
    };
  }, [audit]);

  const counters = (audit && audit.counters) || {};
  const summary = (audit && audit.summary) || { error: 0, warning: 0, info: 0, review: 0, total: 0 };
  const enabled = settings.reader.auditEnabled !== false;

  const statusTime = audit && audit.ranAt ? new Date(audit.ranAt).toLocaleTimeString() : '';
  const checked = Number(counters.images || 0) + Number(counters.controls || 0) + Number(counters.headings || 0);

  const rescan = useCallback(() => {
    if (!audit) return;
    audit.rescan();
    // Announce the summary of the run the user just asked for. Automatic re-runs
    // stay silent: announcing on every DOM change would be noise.
    const next = audit.getEngine && audit.getEngine() ? audit.getEngine().getState() : null;
    const nextSummary = (next && next.summary) || summary;
    if (nextSummary.total === 0) {
      announce(strings.announcements.auditClean, { level: 'standard', source: 'audit' });
      return;
    }
    announce(
      formatMessage(strings.announcements.auditSummary, {
        errors: nextSummary.error,
        warnings: nextSummary.warning,
        review: nextSummary.review,
      }),
      { level: 'standard', source: 'audit', dedupeKey: 'audit.summary' },
    );
  }, [audit, announce, strings, summary]);

  const report = useMemo(() => {
    if (!audit) return '';
    return buildReportText(
      audit,
      strings,
      { url: typeof window !== 'undefined' ? window.location.href : '' },
    );
  }, [audit, strings]);

  const copyReport = useCallback(async () => {
    const text = report;
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setReportFallback('');
        announce(copy.copyReportDone, { level: 'critical', source: 'audit' });
        return;
      }
      throw new Error('clipboard unavailable');
    } catch (error) {
      // Never fail silently: show the report so it can be selected by hand.
      setReportFallback(text);
      announce(copy.copyReportFailed, { level: 'critical', source: 'audit' });
    }
  }, [report, announce, copy]);

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <Switch
        label={copy.enableLabel}
        description={copy.enableHint}
        checked={enabled}
        onChange={(next) => actions.setReader('auditEnabled', next)}
      />

      {enabled ? (
        <>
          <div className="a11ytb-button-row">
            <button type="button" className="a11ytb-button" onClick={rescan}>
              {copy.run}
            </button>
            <button type="button" className="a11ytb-button" onClick={copyReport}>
              {copy.copyReport}
            </button>
          </div>

          <p className="a11ytb-status" role="status">
            {audit && audit.ran
              ? formatMessage(copy.statusChecked, {
                  time: statusTime,
                  findings: summary.total,
                })
              : copy.statusNever}
            {summary.total === 0 && audit && audit.ran ? ` ${copy.statusClean}` : ''}
          </p>

          <p className="a11ytb-hint">
            {formatMessage(copy.summaryLine, {
              errors: summary.error,
              warnings: summary.warning,
              notes: summary.info,
              review: summary.review,
            })}
          </p>

          {audit && audit.truncated ? (
            <p className="a11ytb-note a11ytb-note--warning">{copy.truncated}</p>
          ) : null}

          <h4 className="a11ytb-note__heading">{copy.detectedHeading}</h4>
          <p className="a11ytb-hint">{copy.detectedIntro}</p>
          <FindingList
            findings={grouped.detected}
            emptyMessage={copy.detectedEmpty}
            className="a11ytb-audit-group"
          />

          <h4 className="a11ytb-note__heading">{copy.reviewHeading}</h4>
          <p className="a11ytb-hint">{copy.reviewIntro}</p>
          <FindingList
            findings={grouped.review}
            emptyMessage={copy.reviewEmpty}
            className="a11ytb-audit-group"
          />

          <h4 className="a11ytb-note__heading">{copy.countersHeading}</h4>
          <ul className="a11ytb-uninspectable">
            {Object.keys(counters).map((key) => (
              <li key={key}>
                {copy.counterLabels[key] || key}: <strong>{counters[key]}</strong>
              </li>
            ))}
          </ul>
          <p className="a11ytb-hint">{copy.scope}</p>

          {reportFallback ? (
            <>
              <label className="a11ytb-field__label" htmlFor="a11ytb-audit-report">
                {copy.reportLabel}
              </label>
              <textarea
                className="a11ytb-report"
                id="a11ytb-audit-report"
                readOnly
                rows={12}
                value={reportFallback}
              />
            </>
          ) : null}
        </>
      ) : (
        <p className="a11ytb-status">{copy.statusDisabled}</p>
      )}

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{copy.cannotHeading}</h4>
        <ul>
          {copy.cannot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="a11ytb-note">
        <h4 className="a11ytb-note__heading">{copy.ownUiHeading}</h4>
        <p>{copy.ownUi}</p>
      </div>
    </div>
  );
}
