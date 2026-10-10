/**
 * Check: image alternative text.
 *
 * What this check may state as fact:
 *  - an <img> has no alt attribute at all;
 *  - a link or button whose only content is such an image therefore has no
 *    accessible name (computed, not guessed);
 *  - the alt text is literally the file name of the image.
 *
 * What it explicitly refuses to decide:
 *  - whether a description is accurate, complete or useful;
 *  - whether a particular image is decorative.
 *
 * It never proposes a description. The report shows evidence that already exists on
 * the page (the file name, the caption, the link text) and hands the decision to a
 * person.
 */

import { getAccessibleName, visibleText } from '../../dom/accessibilityName.js';
import {
  describeElement,
  elementAreaPx,
  elementKey,
  isElementVisible,
  isExcludedFromScanning,
  isOwnedByToolbar,
  viewportAreaPx,
} from '../../dom/domScope.js';
import { AUDIT_LIMITS } from '../../../constants.js';
import { CERTAINTY, SEVERITIES, createFinding } from '../findings.js';

const FILE_EXTENSION = /\.(jpe?g|png|gif|webp|svg|avif|bmp)([?#]|$)/i;
const FILE_LIKE_WORD = /^(img|image|dsc|dscn|photo|pic|picture|screenshot|untitled|unnamed|asset|banner)[-_ ]?\d*$/i;
/** Same order of magnitude as the WCAG "large area" heuristics. */
const LARGE_IMAGE_AREA_PX = 21824;

function normalize(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function sourceFileName(element) {
  const src = element.getAttribute('src') || element.getAttribute('srcset') || '';
  if (!src) return '';
  const first = src.split(',')[0].trim().split(' ')[0];
  const clean = first.split('?')[0].split('#')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || '';
}

/** The link/button this image belongs to, when the image is its only content. */
function controlWithoutOtherName(element) {
  if (typeof element.closest !== 'function') return null;
  const control = element.closest('a[href], button, [role="link"], [role="button"]');
  if (!control) return null;
  const { name } = getAccessibleName(control);
  return name.trim() === '' ? control : null;
}

/** Text that already exists next to the image (caption or the rest of the link). */
function adjacentText(element) {
  if (typeof element.closest !== 'function') return '';
  const figure = element.closest('figure');
  if (figure) {
    const caption = figure.querySelector('figcaption');
    if (caption) return visibleText(caption);
  }
  const control = element.closest('a[href], button');
  if (control) return visibleText(control, { skip: element });
  return '';
}

export const checkImageAlt = {
  id: 'image-alt',
  title: 'Image alternative text',
  detects:
    'Images with no alt attribute at all, links or buttons whose only content is an image without a name, and alt text that is just the file name.',
  needsReview:
    'Whether a description is accurate, and whether an image is decorative rather than informative.',
  wcag: [
    { id: '1.1.1', level: 'A', title: 'Non-text Content' },
    { id: '4.1.2', level: 'A', title: 'Name, Role, Value' },
    { id: '2.4.4', level: 'A', title: 'Link Purpose (In Context)' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const counters = {
      images: 0,
      withAltText: 0,
      missingAlt: 0,
      emptyAlt: 0,
      controlsWithoutName: 0,
      needsReview: 0,
    };
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters };

    const viewportArea = viewportAreaPx();
    const nodes = Array.from(root.querySelectorAll('img, input[type="image"]')).slice(
      0,
      limits.MAX_NODES_PER_CHECK,
    );

    nodes.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
      if (!isElementVisible(element)) return;

      counters.images += 1;
      const key = elementKey(element);
      const label = describeElement(element) || 'image';
      const file = sourceFileName(element);
      const hasAlt = element.hasAttribute('alt');
      const alt = hasAlt ? element.getAttribute('alt') || '' : null;
      const control = controlWithoutOtherName(element);

      const base = {
        checkId: 'image-alt',
        elementKey: key,
        label,
        element,
      };

      // ── No alt attribute at all ───────────────────────────────────────────
      if (!hasAlt) {
        counters.missingAlt += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'missing-alt',
            severity: SEVERITIES.ERROR,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '1.1.1', level: 'A' }],
            message:
              'This image has no alt attribute. Assistive technology may read out the file name, or skip the image without telling anyone what it was.',
            why: 'Images that carry information need a text alternative in the markup.',
            evidence: file ? `file: ${file}` : '',
            fixExampleId: 'image-alt-missing',
          }),
        );

        if (control) {
          counters.controlsWithoutName += 1;
          findings.push(
            createFinding({
              ...base,
              code: 'control-without-name',
              severity: SEVERITIES.ERROR,
              certainty: CERTAINTY.DETECTABLE,
              wcag: [
                { id: '4.1.2', level: 'A' },
                { id: '2.4.4', level: 'A' },
              ],
              message:
                'This image is the entire content of a link or button, and it has no alt attribute, so the control has no accessible name.',
              why: 'A control with no name is announced as "link" or "button" and cannot be used reliably.',
              evidence: control.tagName.toLowerCase(),
              fixExampleId: 'image-link-name',
            }),
          );
        }
        return;
      }

      // ── alt="" (claimed decorative) ───────────────────────────────────────
      if (alt.trim() === '') {
        counters.emptyAlt += 1;

        if (control) {
          counters.controlsWithoutName += 1;
          findings.push(
            createFinding({
              ...base,
              code: 'empty-alt-in-control',
              severity: SEVERITIES.ERROR,
              certainty: CERTAINTY.DETECTABLE,
              wcag: [
                { id: '4.1.2', level: 'A' },
                { id: '2.4.4', level: 'A' },
              ],
              message:
                'This image is the entire content of a link or button and is marked decorative with alt="", so the control has no accessible name.',
              why: 'The control still needs a name, either from the image or from an aria-label on the link.',
              evidence: control.tagName.toLowerCase(),
              fixExampleId: 'image-link-name',
            }),
          );
          return;
        }

        const area = elementAreaPx(element);
        const isLarge =
          area >= LARGE_IMAGE_AREA_PX || (viewportArea > 0 && area / viewportArea >= 0.25);
        if (isLarge) {
          counters.needsReview += 1;
          findings.push(
            createFinding({
              ...base,
              code: 'large-empty-alt',
              severity: SEVERITIES.WARNING,
              certainty: CERTAINTY.REVIEW,
              wcag: [{ id: '1.1.1', level: 'A' }],
              message:
                'This is a large image marked decorative with alt="", which is correct only if it really carries no information.',
              why: 'Large images usually communicate something; an empty alt hides them from assistive technology completely.',
              evidence: file ? `file: ${file}` : '',
              fixExampleId: 'image-alt-decorative',
            }),
          );
        }
        return;
      }

      // ── There is alt text: check what it looks like, never how good it is ──
      counters.withAltText += 1;
      const altText = alt.trim();
      const looksLikeFileName =
        FILE_EXTENSION.test(altText) ||
        FILE_LIKE_WORD.test(altText) ||
        (file !== '' && normalize(altText) === normalize(file));

      if (looksLikeFileName) {
        counters.needsReview += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'filename-alt',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.1.1', level: 'A' }],
            message: 'The alt text repeats a file name instead of describing the image.',
            why: 'A file name tells the listener nothing about what the image shows.',
            evidence: `alt="${altText}"`,
            fixExampleId: 'image-alt-quality',
          }),
        );
        return;
      }

      const role = (element.getAttribute('role') || '').toLowerCase();
      if (role === 'presentation' || role === 'none') {
        counters.needsReview += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'alt-with-presentation-role',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.1.1', level: 'A' }],
            message:
              'This image has alt text and is also marked role="presentation", which asks assistive technology to ignore it. One of the two is wrong.',
            why: 'The usual fix is alt="" without the role, or remove the role and keep the description.',
            evidence: `role="${role}", alt="${altText}"`,
            fixExampleId: 'image-alt-quality',
          }),
        );
        return;
      }

      const nearby = adjacentText(element);
      if (nearby && normalize(nearby) === normalize(altText)) {
        counters.needsReview += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'redundant-alt',
            severity: SEVERITIES.INFO,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.1.1', level: 'A' }],
            message: 'The alt text is identical to text that is already next to the image.',
            why: 'Listeners hear the same sentence twice in a row; the image is probably decorative.',
            evidence: `alt="${altText}"`,
            fixExampleId: 'image-alt-quality',
          }),
        );
      }
    });

    return { findings, counters };
  },
};
