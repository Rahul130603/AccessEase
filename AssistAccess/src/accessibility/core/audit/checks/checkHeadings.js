/**
 * Check: headings.
 *
 * Detected facts: no heading elements at all, empty headings, headings hidden from
 * assistive technology, role="heading" without a usable aria-level.
 *
 * Review items: a missing h1, skipped levels (not a WCAG failure by itself),
 * and — as a clearly labelled heuristic — text that is styled to look like a
 * heading but is not one.
 *
 * The check also returns the heading outline, which the panel renders as a nested
 * list of links so a screen reader user can jump through the page structure. The
 * outline is data; nothing is written into the page.
 */

import { visibleText } from '../../dom/accessibilityName.js';
import {
  describeElement,
  elementKey,
  isExcludedFromScanning,
  isOwnedByToolbar,
} from '../../dom/domScope.js';
import { AUDIT_LIMITS } from '../../../constants.js';
import { CERTAINTY, SEVERITIES, createFinding } from '../findings.js';

const NATIVE_HEADING = /^H[1-6]$/;
const HEADING_LIKE_CLASS = /(^|[-_])(h[1-6]|heading|headline|title|subtitle)([-_]|$)/i;
const MAX_FAKE_HEADING_FINDINGS = 5;
const MAX_CLASS_SCAN = 1500;

export const checkHeadings = {
  id: 'headings',
  title: 'Headings',
  detects:
    'Pages with no heading elements, empty headings, headings hidden from assistive technology, and role="heading" without a usable level.',
  needsReview:
    'Whether a page needs an h1, whether skipped levels are intentional, and whether text that merely looks like a heading should be one.',
  wcag: [
    { id: '1.3.1', level: 'A', title: 'Info and Relationships' },
    { id: '2.4.6', level: 'AA', title: 'Headings and Labels' },
    { id: '2.4.10', level: 'AAA', title: 'Section Headings' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const outline = [];
    const counters = { headings: 0, h1: 0, empty: 0, hidden: 0, levelSkips: 0, fakeHeadingCandidates: 0 };
    /** element key → element, so the outline panel can navigate to any heading. */
    const elements = new Map();
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters, outline, elements };

    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).slice(
      0,
      limits.MAX_NODES_PER_CHECK,
    );

    let previousLevel = 0;

    headings.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;

      const isNative = NATIVE_HEADING.test(element.tagName);
      const rawLevel = isNative ? Number(element.tagName.charAt(1)) : Number(element.getAttribute('aria-level'));
      const level = Number.isFinite(rawLevel) && rawLevel >= 1 && rawLevel <= 6 ? rawLevel : null;
      const text = visibleText(element);
      const key = elementKey(element);
      const hidden = element.getAttribute('aria-hidden') === 'true';
      const label = describeElement(element) || 'heading';

      counters.headings += 1;
      if (level === 1) counters.h1 += 1;
      if (hidden) counters.hidden += 1;
      elements.set(key, element);

      outline.push({
        id: `heading:${key}`,
        elementKey: key,
        level,
        text: text || '',
        hidden,
        tag: isNative ? element.tagName.toLowerCase() : 'role="heading"',
      });

      const base = { checkId: 'headings', elementKey: key, label, element, focusable: false };

      if (!isNative && level === null) {
        findings.push(
          createFinding({
            ...base,
            code: 'heading-without-level',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '4.1.2', level: 'A' }],
            message: 'This element has role="heading" but no valid aria-level, so its position in the outline is unknown.',
            why: 'A heading role without a level is announced without the structure it is meant to express.',
            evidence: element.getAttribute('aria-level')
              ? `aria-level="${element.getAttribute('aria-level')}"`
              : 'no aria-level',
            fixExampleId: 'headings-missing',
          }),
        );
      }

      if (!text) {
        counters.empty += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'empty-heading',
            severity: SEVERITIES.ERROR,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '1.3.1', level: 'A' }],
            message: 'This heading has no text, so it is announced as a level with no content.',
            why: 'Empty headings are usually spacing hacks or icons without a text alternative.',
            fixExampleId: 'headings-empty',
          }),
        );
      }

      if (hidden) {
        findings.push(
          createFinding({
            ...base,
            code: 'hidden-heading',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '1.3.1', level: 'A' }],
            message: 'This heading is hidden from assistive technology with aria-hidden="true".',
            why: 'Hidden headings disappear from the outline, so the page loses a level that sighted users still see.',
            fixExampleId: 'headings-missing',
          }),
        );
      }

      if (level !== null && previousLevel > 0 && level - previousLevel >= 2) {
        counters.levelSkips += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'level-skip',
            severity: SEVERITIES.INFO,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '2.4.10', level: 'AAA' }],
            message: `This heading jumps from level ${previousLevel} to level ${level}.`,
            why: 'Skipped levels are not a WCAG failure on their own, but they make the outline harder to follow and are usually a font-size decision.',
            evidence: `previous level ${previousLevel}, this level ${level}`,
            fixExampleId: 'headings-skip',
          }),
        );
      }

      if (level !== null) previousLevel = level;
    });

    if (counters.headings === 0) {
      findings.push(
        createFinding({
          checkId: 'headings',
          elementKey: 'document',
          label: 'the page',
          code: 'no-headings',
          severity: SEVERITIES.ERROR,
          certainty: CERTAINTY.DETECTABLE,
          wcag: [
            { id: '1.3.1', level: 'A' },
            { id: '2.4.6', level: 'AA' },
          ],
          message: 'No heading elements were found on this page.',
          why: 'Headings are how screen reader users skim and navigate a page; without them every page reads as one long block.',
          fixExampleId: 'headings-missing',
        }),
      );
    } else if (counters.h1 === 0) {
      findings.push(
        createFinding({
          checkId: 'headings',
          elementKey: 'document',
          label: 'the page',
          code: 'no-h1',
          severity: SEVERITIES.WARNING,
          certainty: CERTAINTY.REVIEW,
          wcag: [{ id: '1.3.1', level: 'A' }],
          message: 'No level 1 heading was found (other heading levels exist).',
          why: 'A page usually has one h1 naming it; sections of a single-page app may legitimately differ.',
          fixExampleId: 'headings-missing',
        }),
      );
    }

    // ── Heuristic: text styled like a heading that is not a heading ─────────
    const view = root.ownerDocument && root.ownerDocument.defaultView;
    if (view && typeof view.getComputedStyle === 'function') {
      const candidates = Array.from(root.querySelectorAll('[class]')).slice(0, MAX_CLASS_SCAN);
      let reported = 0;
      for (let index = 0; index < candidates.length && reported < MAX_FAKE_HEADING_FINDINGS; index += 1) {
        const element = candidates[index];
        if (NATIVE_HEADING.test(element.tagName)) continue;
        if (element.getAttribute('role') === 'heading') continue;
        if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) continue;
        const className = typeof element.className === 'string' ? element.className : '';
        if (!HEADING_LIKE_CLASS.test(className)) continue;
        if (element.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]')) continue;
        const text = visibleText(element);
        if (!text || text.length > 80) continue;
        const style = view.getComputedStyle(element);
        const size = Number.parseFloat(style.fontSize) || 0;
        const weight = Number(style.fontWeight) || 400;
        if (size < 20 && weight < 600) continue;

        reported += 1;
        counters.fakeHeadingCandidates += 1;
        findings.push(
          createFinding({
            checkId: 'headings',
            elementKey: elementKey(element),
            label: describeElement(element) || 'styled text',
            element,
            code: 'possible-fake-heading',
            severity: SEVERITIES.INFO,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.3.1', level: 'A' }],
            message: 'This looks like a heading visually but is not a heading element.',
            why: 'Styling is not structure: a bold, large text block is invisible to heading navigation.',
            evidence: `class "${className}", about ${Math.round(size)}px, weight ${weight}`,
            fixExampleId: 'headings-missing',
          }),
        );
      }
    }

    return { findings, counters, outline, elements };
  },
};
