/**
 * Check: landmarks.
 *
 * Detected facts: no <main> (or role="main") at all, more than one visible main,
 * several navigation landmarks that cannot be told apart.
 *
 * Review items: whether a navigation landmark is needed at all, and whether a skip
 * link is required by the layout (a page whose main content is the first thing in
 * the tab order does not need one).
 *
 * The check never adds a role, never wraps content in a landmark and never
 * re-parents anything: landmark structure is a template decision.
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

function findSkipLink(documentRef, main) {
  if (!documentRef || typeof documentRef.querySelectorAll !== 'function') return null;
  const anchors = Array.from(documentRef.querySelectorAll('a[href^="#"]'));
  return (
    anchors.find((anchor) => {
      const target = (anchor.getAttribute('href') || '').slice(1);
      if (!target) return false;
      const targetElement = documentRef.getElementById(target);
      if (!targetElement) return false;
      const pointsAtMain = main ? targetElement === main || main.contains(targetElement) : false;
      const looksLikeSkipLink = /skip|jump/i.test(visibleText(anchor));
      return pointsAtMain || (looksLikeSkipLink && targetElement.tagName === 'MAIN');
    }) || null
  );
}

export const checkLandmarks = {
  id: 'landmarks',
  title: 'Landmarks and bypass blocks',
  detects:
    'No main landmark, more than one visible main landmark, and navigation landmarks that cannot be distinguished from each other.',
  needsReview:
    'Whether the layout needs a navigation landmark, and whether a skip link is required for the content order.',
  wcag: [
    { id: '1.3.1', level: 'A', title: 'Info and Relationships' },
    { id: '2.4.1', level: 'A', title: 'Bypass Blocks' },
    { id: '2.4.6', level: 'AA', title: 'Headings and Labels' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const counters = { mains: 0, visibleMains: 0, navs: 0, unnamedNavs: 0, hasSkipLink: 0 };
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters };

    const documentRef = root.ownerDocument || (typeof document !== 'undefined' ? document : null);

    const filterOwned = (element) => !isOwnedByToolbar(element) && !isExcludedFromScanning(element);

    const mains = Array.from(root.querySelectorAll('main, [role="main"]'))
      .filter(filterOwned)
      .slice(0, limits.MAX_NODES_PER_CHECK);
    const visibleMains = mains.filter((element) => isElementVisible(element));
    counters.mains = mains.length;
    counters.visibleMains = visibleMains.length;

    if (mains.length === 0) {
      findings.push(
        createFinding({
          checkId: 'landmarks',
          elementKey: 'document',
          label: 'the page',
          code: 'no-main',
          severity: SEVERITIES.ERROR,
          certainty: CERTAINTY.DETECTABLE,
          wcag: [
            { id: '1.3.1', level: 'A' },
            { id: '2.4.1', level: 'A' },
          ],
          message: 'No main landmark was found on this page.',
          why: 'A main landmark lets screen reader users jump straight past repeated headers and navigation to the content.',
          fixExampleId: 'landmarks-main',
        }),
      );
    } else if (visibleMains.length > 1) {
      findings.push(
        createFinding({
          checkId: 'landmarks',
          elementKey: 'document',
          label: 'the page',
          code: 'multiple-main',
          severity: SEVERITIES.ERROR,
          certainty: CERTAINTY.DETECTABLE,
          wcag: [{ id: '1.3.1', level: 'A' }],
          message: `More than one visible main landmark was found (${visibleMains.length}).`,
          why: 'One main per page: with two, "go to main content" becomes a guess.',
          evidence: visibleMains
            .slice(0, 3)
            .map((element) => describeElement(element))
            .join(' | '),
          fixExampleId: 'landmarks-main',
        }),
      );
    }

    // ── Skip link ───────────────────────────────────────────────────────────
    const main = visibleMains[0] || null;
    const skipLink = findSkipLink(documentRef, main);
    if (skipLink) counters.hasSkipLink = 1;
    else if (main) {
      findings.push(
        createFinding({
          checkId: 'landmarks',
          elementKey: elementKey(main),
          label: describeElement(main) || 'main landmark',
          element: main,
          code: 'no-skip-link',
          severity: SEVERITIES.INFO,
          certainty: CERTAINTY.REVIEW,
          wcag: [{ id: '2.4.1', level: 'A' }],
          message: 'No skip link to the main content was found.',
          why: 'Keyboard users have to tab through every navigation item on every page. A page whose content comes first in the tab order does not need one — that is a judgement call.',
          fixExampleId: 'landmarks-main',
        }),
      );
    }

    // ── Navigation landmarks ────────────────────────────────────────────────
    const navs = Array.from(root.querySelectorAll('nav, [role="navigation"]'))
      .filter(filterOwned)
      .filter((element) => isElementVisible(element))
      .slice(0, limits.MAX_NODES_PER_CHECK);
    counters.navs = navs.length;

    if (navs.length === 0) {
      findings.push(
        createFinding({
          checkId: 'landmarks',
          elementKey: 'document',
          label: 'the page',
          code: 'no-navigation',
          severity: SEVERITIES.INFO,
          certainty: CERTAINTY.REVIEW,
          wcag: [{ id: '1.3.1', level: 'A' }],
          message: 'No navigation landmark was found.',
          why: 'If the page has a menu, marking it as navigation lets screen reader users find and skip it.',
          fixExampleId: 'landmarks-main',
        }),
      );
    } else if (navs.length > 1) {
      const unnamed = navs.filter((element) => getAccessibleName(element).name.trim() === '');
      counters.unnamedNavs = unnamed.length;
      if (unnamed.length > 1) {
        findings.push(
          createFinding({
            checkId: 'landmarks',
            elementKey: 'document',
            label: 'the page',
            code: 'ambiguous-navigation',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '2.4.6', level: 'AA' }],
            message: `${unnamed.length} navigation landmarks have no accessible name, so they all appear as "navigation" in a landmark list.`,
            why: 'When a page has several of the same landmark, each one needs a name so it can be chosen.',
            evidence: unnamed
              .slice(0, 3)
              .map((element) => describeElement(element))
              .join(' | '),
            fixExampleId: 'landmarks-main',
          }),
        );
      }
    }

    return { findings, counters };
  },
};
