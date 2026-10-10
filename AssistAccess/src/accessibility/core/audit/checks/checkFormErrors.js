/**
 * Check: error messages.
 *
 * Detected facts (the DOM proves them):
 *  - a field is marked `aria-invalid="true"` but no message is associated with it,
 *    so a screen reader user hears "invalid" and nothing about what to do;
 *  - a form-level summary exists but links to nothing (checked by the label/orphan
 *    logic in the form-label check).
 *
 * Review items (a person must decide):
 *  - a block that looks like an error message which no field points at;
 *  - a field the browser considers invalid while `aria-invalid` was never set.
 *
 * The check reads only. It never sets aria-invalid, never adds aria-describedby and
 * never moves a message into a field's neighbourhood: doing that at runtime would
 * fight the form's own state and could announce the same error twice.
 */

import { visibleText } from '../../dom/accessibilityName.js';
import {
  describeElement,
  elementKey,
  isElementVisible,
  isExcludedFromScanning,
  isOwnedByToolbar,
} from '../../dom/domScope.js';
import { AUDIT_LIMITS } from '../../../constants.js';
import { CERTAINTY, SEVERITIES, createFinding } from '../findings.js';

const CONTROL_SELECTOR = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"])',
  'select',
  'textarea',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
].join(', ');

const ERROR_TEXT_HINT = /(error|invalid|required|incorrect|not valid|must be|must have|isn't|is not)/i;
const ERROR_CLASS_HINT = /(^|[-_])(error|invalid|has-error|field-error|form-error|help-block|feedback)([-_]|$)/i;
const MAX_UNASSOCIATED_REPORTED = 3;
const MAX_CANDIDATES = 200;

function descriptionTargets(element, documentRef) {
  const targets = [];
  ['aria-describedby', 'aria-errormessage'].forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (!value) return;
    value
      .split(/\s+/)
      .filter(Boolean)
      .forEach((id) => {
        const target = documentRef ? documentRef.getElementById(id) : null;
        if (target) targets.push(target);
      });
  });
  return targets;
}

function looksLikeErrorContainer(element) {
  if (element.getAttribute('role') === 'alert') return true;
  const live = (element.getAttribute('aria-live') || '').toLowerCase();
  if (live === 'assertive' || live === 'polite') return true;
  const className = typeof element.className === 'string' ? element.className : '';
  if (ERROR_CLASS_HINT.test(className)) return true;
  if (/error|invalid/i.test(element.id || '')) return true;
  const text = visibleText(element);
  return Boolean(text && text.length < 200 && ERROR_TEXT_HINT.test(text));
}

export const checkFormErrors = {
  id: 'form-errors',
  title: 'Error messages',
  detects:
    'Fields marked aria-invalid with no message associated, so the error is announced without any instruction on how to fix it.',
  needsReview:
    'Blocks that look like error messages which no field points at, and fields the browser considers invalid while aria-invalid is unset.',
  wcag: [
    { id: '3.3.1', level: 'A', title: 'Error Identification' },
    { id: '3.3.3', level: 'AA', title: 'Error Suggestion' },
    { id: '4.1.3', level: 'AA', title: 'Status Messages' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const counters = {
      invalidMarked: 0,
      invalidWithoutMessage: 0,
      errorCandidates: 0,
      unassociatedErrors: 0,
      invalidNotMarked: 0,
    };
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters };

    const documentRef = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
    const controls = Array.from(root.querySelectorAll(CONTROL_SELECTOR)).slice(
      0,
      limits.MAX_NODES_PER_CHECK,
    );

    // Every id any control already points at, so error containers can be matched.
    const referencedIds = new Set();
    controls.forEach((element) => {
      ['aria-describedby', 'aria-errormessage'].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;
        value
          .split(/\s+/)
          .filter(Boolean)
          .forEach((id) => referencedIds.add(id));
      });
    });

    controls.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
      if (!isElementVisible(element)) return;

      const key = elementKey(element);
      const label = describeElement(element) || element.tagName.toLowerCase();
      const invalidMarked = element.getAttribute('aria-invalid') === 'true';
      const hasMessage = descriptionTargets(element, documentRef).some(
        (target) => visibleText(target).length > 0,
      );

      if (invalidMarked) {
        counters.invalidMarked += 1;
        if (!hasMessage) {
          counters.invalidWithoutMessage += 1;
          findings.push(
            createFinding({
              checkId: 'form-errors',
              elementKey: key,
              label,
              element,
              focusable: true,
              code: 'invalid-without-message',
              severity: SEVERITIES.ERROR,
              certainty: CERTAINTY.DETECTABLE,
              wcag: [
                { id: '3.3.1', level: 'A' },
                { id: '3.3.3', level: 'AA' },
              ],
              message:
                'This field is marked invalid, but no message is associated with it, so the error is announced without any explanation.',
              why: 'An error has to be identified in text and connected to the field, not only flagged with a state.',
              evidence: `aria-invalid="true"${element.getAttribute('aria-describedby') ? `, aria-describedby="${element.getAttribute('aria-describedby')}" points at nothing with text` : ', no aria-describedby'}`,
              fixExampleId: 'error-association',
            }),
          );
        }
        return;
      }

      if (
        typeof element.matches === 'function' &&
        element.matches(':invalid') &&
        !element.hasAttribute('readonly') &&
        !hasMessage
      ) {
        counters.invalidNotMarked += 1;
        findings.push(
          createFinding({
            checkId: 'form-errors',
            elementKey: key,
            label,
            element,
            focusable: true,
            code: 'invalid-not-marked',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '3.3.1', level: 'A' }],
            message:
              'The browser treats this field as invalid, but aria-invalid is not set and no message is associated with it.',
            why: 'Native validation styling is invisible to assistive technology; the state and the message have to be exposed as well.',
            evidence: `type=${element.getAttribute('type') || element.tagName.toLowerCase()}, required=${element.hasAttribute('required')}`,
            fixExampleId: 'error-association',
          }),
        );
      }
    });

    // ── Error-looking blocks that no field points at ─────────────────────────
    const candidates = Array.from(
      root.querySelectorAll('[role="alert"], [aria-live], [class*="error" i], [id*="error" i]'),
    ).slice(0, MAX_CANDIDATES);

    let reported = 0;
    candidates.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
      if (!isElementVisible(element)) return;
      if (!looksLikeErrorContainer(element)) return;

      counters.errorCandidates += 1;
      if (element.id && referencedIds.has(element.id)) return; // already associated
      if (visibleText(element).length === 0) return;

      counters.unassociatedErrors += 1;
      if (reported >= MAX_UNASSOCIATED_REPORTED) return;
      reported += 1;

      findings.push(
        createFinding({
          checkId: 'form-errors',
          elementKey: elementKey(element),
          label: describeElement(element) || 'message block',
          element,
          code: 'unassociated-error',
          severity: SEVERITIES.WARNING,
          certainty: CERTAINTY.REVIEW,
          wcag: [
            { id: '3.3.1', level: 'A' },
            { id: '4.1.3', level: 'AA' },
          ],
          message:
            'This looks like an error message, but no field points at it, so a screen reader user may never hear it.',
          why: 'Messages that are only visible are missed by anyone who cannot see the form; the field must reference the message.',
          evidence: `text: "${visibleText(element).slice(0, 80)}"`,
          fixExampleId: 'error-association',
        }),
      );
    });

    return { findings, counters };
  },
};
