/**
 * Plain-text audit report, for pasting into a ticket or sending to whoever owns
 * the markup.
 *
 * The report always carries its own framing: what was checked, what a machine can
 * prove, what it cannot, and the explicit statement that the presence of alt text
 * is not evidence of its quality. A report that omits that framing is how toolbars
 * end up implying compliance they cannot deliver.
 */

import { formatMessage } from '../../strings.js';
import { CERTAINTY } from './findings.js';

function formatFinding(finding) {
  const wcag = (finding.wcag || []).map((item) => `${item.id} (${item.level})`).join(', ');
  return [
    `- [${finding.severity}] ${finding.label}: ${finding.message}`,
    finding.evidence ? `    evidence: ${finding.evidence}` : '',
    finding.why ? `    why it matters: ${finding.why}` : '',
    wcag ? `    WCAG: ${wcag}` : '',
    finding.fixExampleId ? `    fix example: ${finding.fixExampleId}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * @param {object} state audit state from the engine
 * @param {object} strings copy table (createStrings())
 * @param {{url?: string}} [options]
 */
export function buildReportText(state, strings, options = {}) {
  const copy = strings.audit.report;
  const summary = state.summary || { error: 0, warning: 0, info: 0, review: 0, detectable: 0, total: 0 };
  const lines = [];

  lines.push(copy.title);
  lines.push(formatMessage(copy.page, { url: options.url || '' }));
  lines.push(formatMessage(copy.generated, { time: new Date().toLocaleString() }));
  lines.push('');
  copy.framing.forEach((line) => lines.push(line));
  lines.push('');
  lines.push(
    formatMessage(copy.summary, {
      errors: summary.error,
      warnings: summary.warning,
      notes: summary.info,
      review: summary.review,
    }),
  );

  const counters = state.counters || {};
  const counterKeys = Object.keys(counters);
  if (counterKeys.length) {
    lines.push('');
    lines.push(copy.countersHeading);
    counterKeys.forEach((key) => {
      lines.push(`- ${key}: ${counters[key]}`);
    });
  }

  const detected = state.findings.filter((finding) => finding.certainty !== CERTAINTY.REVIEW);
  const review = state.findings.filter((finding) => finding.certainty === CERTAINTY.REVIEW);

  lines.push('');
  lines.push(`${copy.detectedHeading} (${detected.length})`);
  if (detected.length === 0) lines.push(copy.noneDetected);
  detected.forEach((finding) => lines.push(formatFinding(finding)));

  lines.push('');
  lines.push(`${copy.reviewHeading} (${review.length})`);
  if (review.length === 0) lines.push(copy.noneReview);
  review.forEach((finding) => lines.push(formatFinding(finding)));

  if (state.truncated) {
    lines.push('');
    lines.push(copy.truncated);
  }

  lines.push('');
  copy.caveats.forEach((line) => lines.push(line));

  return lines.join('\n');
}
