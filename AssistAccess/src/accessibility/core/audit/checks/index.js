/**
 * The audit checks, in report order.
 *
 * Each check exposes:
 *   id            stable identifier used in findings and in the copy
 *   title         what it looks at
 *   detects       what it can prove from the DOM
 *   needsReview   what it can only raise for a human decision
 *   wcag          the success criteria this check relates to
 *   run(context)  ({ root, limits }) => { findings, counters, outline? }
 *
 * Checks must be read-only. They may not set attributes, wrap elements, move
 * nodes or write text into the page: a toolbar that rewrites another team's DOM
 * can break their forms, their tests and their framework's reconciliation.
 */

import { checkAuthFields } from './checkAuthFields.js';
import { checkFormErrors } from './checkFormErrors.js';
import { checkFormLabels } from './checkFormLabels.js';
import { checkHeadings } from './checkHeadings.js';
import { checkImageAlt } from './checkImageAlt.js';
import { checkLandmarks } from './checkLandmarks.js';

export const AUDIT_CHECKS = [
  checkImageAlt,
  checkFormLabels,
  checkFormErrors,
  checkAuthFields,
  checkHeadings,
  checkLandmarks,
];

export function getAuditCheck(id) {
  return AUDIT_CHECKS.find((check) => check.id === id) || null;
}

export { checkImageAlt, checkFormLabels, checkFormErrors, checkAuthFields, checkHeadings, checkLandmarks };
