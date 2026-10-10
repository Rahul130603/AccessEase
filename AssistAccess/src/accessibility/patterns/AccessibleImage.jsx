import React from 'react';

import { warnDev } from '../core/warnDev.js';
import { useStructureStyles } from './appStyles.js';

/**
 * Accessible image components (feature: image alternative text).
 *
 * The component does not write descriptions and does not guess. It forces a
 * decision and fails loudly when the decision is missing, in development only:
 *
 *   <AccessibleImage src="/q4.png" alt="Revenue by quarter: Q4 is highest" />
 *   <AccessibleImage src="/divider.png" decorative />
 *
 *  - `decorative` renders alt="". That is the semantic way to hide an image from
 *    assistive technology; role="presentation" is redundant and is deliberately not
 *    added.
 *  - Passing neither `alt` nor `decorative` leaves the alt attribute **off** (which
 *    is what a missing decision looks like to an audit) and warns in development.
 *    Silently rendering alt="" would hide a meaningful image from screen reader
 *    users, which is worse than an obvious gap.
 *  - The toolbar never fills this in later: no description can be derived from the
 *    DOM, and a plausible-sounding but wrong description is worse than none.
 */

const FILE_EXTENSION = /\.(jpe?g|png|gif|webp|svg|avif|bmp)([?#]|$)/i;

export function AccessibleImage({
  src,
  alt,
  decorative = false,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) {
  const hasAlt = typeof alt === 'string' && alt.trim() !== '';

  if (decorative && hasAlt) {
    warnDev(
      `decorative-and-alt:${src}`,
      `<AccessibleImage src="${src}"> was given both decorative and alt. The description is ignored, so remove one of them: keep alt for a meaningful image, or decorative for a purely visual one.`,
    );
  }

  if (!decorative && typeof alt !== 'string') {
    warnDev(
      `no-alt-decision:${src}`,
      `<AccessibleImage src="${src}"> has no alt and is not marked decorative. Decide: describe the image with alt="...", or mark it decorative. The alt attribute is intentionally left out until you do, so an audit still reports it.`,
    );
  }

  if (hasAlt && (FILE_EXTENSION.test(alt.trim()) || /^(img|image|photo|screenshot|banner)[-_ ]?\d*$/i.test(alt.trim()))) {
    warnDev(
      `filename-alt:${src}`,
      `<AccessibleImage src="${src}"> looks like it uses a file name as alt text. Describe the purpose of the image instead of its file.`,
    );
  }

  let resolvedAlt;
  if (decorative) resolvedAlt = '';
  else if (typeof alt === 'string') resolvedAlt = alt;
  else resolvedAlt = undefined; // React omits the attribute entirely

  return (
    <img
      className={className}
      src={src}
      alt={resolvedAlt}
      loading={loading}
      decoding={decoding}
      {...rest}
    />
  );
}

/**
 * Figure with a caption. The caption is *not* a substitute for alt text: it
 * describes for everyone, alt describes for people who cannot see the image. When
 * both would say the same thing, one of them should change — usually the image
 * becomes decorative.
 */
export function Figure({ caption, children, className = '', ...rest }) {
  useStructureStyles();
  return (
    <figure className={`a11ytb-figure ${className}`.trim()} {...rest}>
      {children}
      {caption ? <figcaption className="a11ytb-figure__caption">{caption}</figcaption> : null}
    </figure>
  );
}

export default AccessibleImage;
