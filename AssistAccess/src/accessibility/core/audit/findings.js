/**
 * Finding model shared by every audit check.
 *
 * The important field is `certainty`. It encodes the honest boundary the toolbar
 * must never blur:
 *
 *   detectable    the DOM proves the problem (no alt attribute at all, a label
 *                 pointing at a missing id, no <main> element). A machine can
 *                 state this without judgement.
 *   needs-review  the DOM only makes it *likely* (an empty alt on a large image,
 *                 alt text that looks like a file name, a heading level skip).
 *                 A person has to decide. The toolbar reports its evidence and
 *                 offers no verdict, and it never writes a description or an
 *                 accessible name into the page.
 *
 * Findings are never applied to the page: they are a report the user reads.
 */

export const SEVERITIES = Object.freeze({
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
});

export const CERTAINTY = Object.freeze({
  DETECTABLE: 'detectable',
  REVIEW: 'needs-review',
});

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

/**
 * @param {object} input
 * @param {string} input.checkId check that produced the finding, e.g. 'image-alt'
 * @param {string} input.code stable finding code, e.g. 'missing-alt'
 * @param {'error'|'warning'|'info'} input.severity
 * @param {'detectable'|'needs-review'} input.certainty
 * @param {Array<{id: string, level: string, title?: string}>} input.wcag
 * @param {string} input.label short description of the element the finding is about
 * @param {string} input.message what was detected, stated as fact
 * @param {string} [input.why] why it matters, in one sentence
 * @param {string} [input.evidence] something quoted from the page (text that is
 *   already there, a file name) — never text invented by the toolbar
 * @param {string} [input.fixExampleId] key into fixExamples.js
 * @param {Element} [input.element] target element (kept out of serialisable state)
 * @param {string} input.elementKey stable-ish element key
 */
export function createFinding(input) {
  const { checkId, code, elementKey } = input;
  return {
    id: `${checkId}:${code}:${elementKey}`,
    checkId,
    code,
    severity: input.severity,
    certainty: input.certainty,
    wcag: input.wcag || [],
    label: input.label || '',
    message: input.message || '',
    why: input.why || '',
    evidence: input.evidence || '',
    fixExampleId: input.fixExampleId || null,
    elementKey,
    /** Kept only inside the audit engine; stripped before findings reach React state. */
    element: input.element || null,
    /** True when the toolbar may offer to put focus on the element. */
    focusable: input.focusable === true,
  };
}

/** Counts by severity plus the detectable / needs-review split. */
export function summarizeFindings(findings) {
  const summary = {
    total: findings.length,
    error: 0,
    warning: 0,
    info: 0,
    detectable: 0,
    review: 0,
  };
  findings.forEach((finding) => {
    summary[finding.severity] = (summary[finding.severity] || 0) + 1;
    if (finding.certainty === CERTAINTY.REVIEW) summary.review += 1;
    else summary.detectable += 1;
  });
  return summary;
}

/** Errors first, then deterministic before needs-review, then by check. */
export function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const severity = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
    if (severity !== 0) return severity;
    const certainty = (a.certainty === CERTAINTY.REVIEW ? 1 : 0) - (b.certainty === CERTAINTY.REVIEW ? 1 : 0);
    if (certainty !== 0) return certainty;
    if (a.checkId !== b.checkId) return a.checkId < b.checkId ? -1 : 1;
    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
  });
}
