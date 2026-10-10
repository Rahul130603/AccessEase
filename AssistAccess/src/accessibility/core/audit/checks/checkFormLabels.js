/**
 * Check: form control labels.
 *
 * Fact vs judgement is kept explicit:
 *  - "no accessible name found" is computed from the DOM (native label
 *    association first, then ARIA, then content) and reported as a detected
 *    problem;
 *  - "the name comes from the title attribute only" and "the visible label is not
 *    part of the name" are reported as review items, because both are sometimes
 *    deliberate;
 *  - whether the wording of a label is any good is never judged.
 *
 * The check reads only. It never writes aria-label or aria-labelledby into the
 * page: renaming another team's control from an overlay breaks their tests, their
 * form submission and sometimes their logic.
 */

import { getAccessibleName, visibleText } from '../../dom/accessibilityName.js';
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
  'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"])',
  'select',
  'textarea',
  'button',
  '[role="button"]',
  '[role="link"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
].join(', ');

function normalize(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isGroupedControl(element) {
  const type = (element.getAttribute('type') || '').toLowerCase();
  if (element.tagName === 'INPUT' && (type === 'radio' || type === 'checkbox')) return true;
  const role = (element.getAttribute('role') || '').toLowerCase();
  return role === 'radio' || role === 'checkbox';
}

/** The group wrapper that should carry the question for a set of options. */
function findGroup(element) {
  if (typeof element.closest !== 'function') return null;
  return element.closest('fieldset, [role="radiogroup"], [role="group"]');
}

function groupHasLabel(group) {
  if (!group) return false;
  const legend = group.querySelector('legend');
  if (legend && visibleText(legend)) return true;
  const { name } = getAccessibleName(group);
  return name.trim() !== '';
}

export const checkFormLabels = {
  id: 'form-label',
  title: 'Form control labels',
  detects:
    'Controls with no accessible name at all, placeholders used instead of a label, labels pointing at an id that does not exist, and option groups with no group label.',
  needsReview:
    'Whether a name is descriptive enough, whether a title attribute is an acceptable fallback, and whether a visible label must match the accessible name exactly.',
  wcag: [
    { id: '1.3.1', level: 'A', title: 'Info and Relationships' },
    { id: '3.3.2', level: 'A', title: 'Labels or Instructions' },
    { id: '4.1.2', level: 'A', title: 'Name, Role, Value' },
    { id: '2.5.3', level: 'A', title: 'Label in Name' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const counters = {
      controls: 0,
      named: 0,
      unnamed: 0,
      weakNames: 0,
      orphanLabels: 0,
      groupsWithoutLabel: 0,
    };
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters };

    // ── Controls ────────────────────────────────────────────────────────────
    const controls = Array.from(root.querySelectorAll(CONTROL_SELECTOR)).slice(
      0,
      limits.MAX_NODES_PER_CHECK,
    );
    const reportedGroups = new Set();

    controls.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
      if (!isElementVisible(element)) return;

      counters.controls += 1;
      const key = elementKey(element);
      const label = describeElement(element) || element.tagName.toLowerCase();
      const { name, source } = getAccessibleName(element);
      const base = { checkId: 'form-label', elementKey: key, label, element, focusable: true };

      if (!name.trim()) {
        counters.unnamed += 1;
        findings.push(
          createFinding({
            ...base,
            code: source === 'placeholder' ? 'placeholder-only' : 'missing-label',
            severity: SEVERITIES.ERROR,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [
              { id: '3.3.2', level: 'A' },
              { id: '4.1.2', level: 'A' },
            ],
            message:
              source === 'placeholder'
                ? 'This control has no label. Its only text is a placeholder, which disappears as soon as something is typed.'
                : 'This control has no accessible name: no <label>, no aria-label and no aria-labelledby.',
            why: 'A control without a name cannot be identified by a screen reader user, and voice control cannot target it.',
            evidence: element.getAttribute('placeholder')
              ? `placeholder="${element.getAttribute('placeholder')}"`
              : '',
            fixExampleId: 'form-label-missing',
          }),
        );
        return;
      }

      if (source === 'title') {
        counters.weakNames += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'title-only',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '3.3.2', level: 'A' }],
            message: 'This control is named only by its title attribute.',
            why: 'A title is not reliably announced, is invisible on touch devices, and does not help sighted users.',
            evidence: `title="${element.getAttribute('title')}"`,
            fixExampleId: 'form-label-missing',
          }),
        );
      }

      counters.named += 1;

      // Visible label text should be part of the accessible name (WCAG 2.5.3).
      if (source !== 'label' && element.labels && element.labels.length) {
        const visible = Array.from(element.labels)
          .map((elementLabel) => visibleText(elementLabel))
          .filter(Boolean)
          .join(' ')
          .trim();
        if (visible && !normalize(name).includes(normalize(visible))) {
          findings.push(
            createFinding({
              ...base,
              code: 'label-mismatch',
              severity: SEVERITIES.WARNING,
              certainty: CERTAINTY.REVIEW,
              wcag: [{ id: '2.5.3', level: 'A' }],
              message: 'The visible label text is not contained in the accessible name.',
              why: 'Speech-input users say what they see; if the visible text is missing from the name, the command fails.',
              evidence: `visible: "${visible}" / name: "${name}"`,
              fixExampleId: 'form-label-mismatch',
            }),
          );
        }
      }

      // Option groups need the question, not just the option labels.
      if (isGroupedControl(element)) {
        const group = findGroup(element);
        const groupKey = group ? elementKey(group) : `ungrouped:${key}`;
        if (!groupHasLabel(group) && !reportedGroups.has(groupKey)) {
          reportedGroups.add(groupKey);
          counters.groupsWithoutLabel += 1;
          findings.push(
            createFinding({
              checkId: 'form-label',
              elementKey: groupKey,
              label: group ? describeElement(group) || 'option group' : label,
              element: group || element,
              code: 'group-without-label',
              severity: SEVERITIES.WARNING,
              certainty: CERTAINTY.REVIEW,
              wcag: [{ id: '1.3.1', level: 'A' }],
              message: group
                ? 'This group of options has no group label, so a screen reader user hears the options without the question they answer.'
                : 'These related options are not grouped, so a screen reader user hears the options without the question they answer.',
              why: 'fieldset and legend (or a named group) carry the question; each option keeps its own label.',
              fixExampleId: 'form-group-label',
            }),
          );
        }
      }
    });

    // ── Labels pointing nowhere ─────────────────────────────────────────────
    const documentRef = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (documentRef) {
      const labels = Array.from(root.querySelectorAll('label[for]')).slice(
        0,
        limits.MAX_NODES_PER_CHECK,
      );
      labels.forEach((labelElement) => {
        if (isOwnedByToolbar(labelElement) || isExcludedFromScanning(labelElement)) return;
        const target = labelElement.getAttribute('for');
        if (!target) return;
        const targetElement = documentRef.getElementById(target);
        if (targetElement) return;
        counters.orphanLabels += 1;
        findings.push(
          createFinding({
            checkId: 'form-label',
            elementKey: elementKey(labelElement),
            label: visibleText(labelElement) || 'label element',
            element: labelElement,
            code: 'orphan-label',
            severity: SEVERITIES.ERROR,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [
              { id: '1.3.1', level: 'A' },
              { id: '3.3.2', level: 'A' },
            ],
            message: 'This label points at an id that does not exist, so it labels nothing.',
            why: 'A label with a broken for attribute leaves its field unnamed.',
            evidence: `for="${target}"`,
            fixExampleId: 'form-label-orphan',
          }),
        );
      });
    }

    return { findings, counters };
  },
};
