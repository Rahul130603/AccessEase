import React, { useMemo } from 'react';

import { useAudit } from '../../core/audit/AuditContext.jsx';
import { getFixExample } from '../../core/audit/fixExamples.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { formatMessage } from '../../strings.js';
import FindingList from '../screenReader/FindingList.jsx';
import HeadingOutline from './HeadingOutline.jsx';

/**
 * Feature: accessible headings and landmarks.
 *
 * Contains three things, in this order:
 *  1. the heading outline of the page (navigation, not repair),
 *  2. what the audit found about headings and landmarks, each with the markup that
 *     fixes it, and
 *  3. the components (SkipLink, Main, Section) that get the structure right in the
 *     application's own template.
 *
 * The toolbar never adds a role, never wraps content in a landmark and never turns
 * styled text into a heading at runtime: structure is a template decision, and a
 * patched-up accessibility tree breaks the moment the framework re-renders.
 */
export default function StructurePanel() {
  const { strings } = useA11ySettings();
  const audit = useAudit();
  const copy = strings.headingsLandmarks;

  const findings = useMemo(
    () =>
      audit
        ? audit.findings.filter(
            (finding) => finding.checkId === 'headings' || finding.checkId === 'landmarks',
          )
        : [],
    [audit],
  );

  const counters = (audit && audit.counters) || {};
  const landmarkExample = getFixExample('landmarks-main');
  const headingExample = getFixExample('headings-missing');

  return (
    <div className="a11ytb-feature">
      <p className="a11ytb-hint">{copy.intro}</p>

      <p className="a11ytb-status">
        {formatMessage(copy.countsLine, {
          headings: counters.headings || 0,
          mains: counters.mains || 0,
          navs: counters.navs || 0,
        })}
      </p>

      <h4 className="a11ytb-note__heading">{copy.outlineHeading}</h4>
      <HeadingOutline />

      <h4 className="a11ytb-note__heading">{copy.structureHeading}</h4>
      <p className="a11ytb-hint">{copy.structureIntro}</p>
      {landmarkExample ? (
        <pre className="a11ytb-code">
          <code>{landmarkExample.code}</code>
        </pre>
      ) : null}
      {landmarkExample ? (
        <ul className="a11ytb-uninspectable">
          {landmarkExample.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">{copy.componentHeading}</summary>
        <pre className="a11ytb-code">
          <code>{copy.componentCode}</code>
        </pre>
        {headingExample ? (
          <>
            <p className="a11ytb-details__title">{headingExample.title}</p>
            <pre className="a11ytb-code">
              <code>{headingExample.code}</code>
            </pre>
          </>
        ) : null}
      </details>

      <h4 className="a11ytb-note__heading">{copy.fixHeading}</h4>
      <FindingList findings={findings} emptyMessage={strings.audit.detectedEmpty} />
    </div>
  );
}
