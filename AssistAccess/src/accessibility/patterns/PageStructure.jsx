import React, { useId } from 'react';

import { useStructureStyles } from './appStyles.js';

/**
 * Page structure components (feature: headings and landmarks).
 *
 * These are small on purpose. The right fix for a missing landmark or an
 * unfocusable skip target is markup in the application's own template, so these
 * components render the correct markup once, correctly, and get out of the way:
 *
 *   <SkipLink targetId="main" />
 *   <Main id="main">...</Main>
 *   <Section level={2} heading="Billing">...</Section>
 *
 *  - `Main` renders a real `<main>` with the native landmark role. No role
 *    attribute is added: `<main>` already maps to role="main", and adding it again
 *    is the kind of redundant ARIA that hides real mistakes.
 *  - `tabIndex={-1}` on the main element makes the skip link target focusable in
 *    browsers that do not move focus to a fragment target (Safari with VoiceOver is
 *    the classic case). It does not add the element to the tab order.
 *  - `Section` names a `<section>` with `aria-labelledby` pointing at the heading it
 *    renders itself, which is what turns a plain section into a navigable region.
 */

export function SkipLink({ targetId = 'main', children = 'Skip to main content', className = '', ...rest }) {
  useStructureStyles();
  return (
    <a className={`a11ytb-skip-link ${className}`.trim()} href={`#${targetId}`} {...rest}>
      {children}
    </a>
  );
}

export function Main({ id = 'main', children, className = '', ...rest }) {
  return (
    <main className={className} id={id} tabIndex={-1} {...rest}>
      {children}
    </main>
  );
}

/**
 * @param {object} props
 * @param {1|2|3|4|5|6} [props.level] heading level; keep them in order
 * @param {React.ReactNode} props.heading the heading text
 */
export function Section({ level = 2, heading, children, id, className = '', ...rest }) {
  const generatedId = useId();
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 2));
  const Heading = `h${safeLevel}`;
  const headingId = id ? `${id}-heading` : `a11ytb-section-${generatedId.replace(/[:]/g, '')}`;

  return (
    <section className={className} aria-labelledby={headingId} {...rest}>
      <Heading id={headingId}>{heading}</Heading>
      {children}
    </section>
  );
}

export default SkipLink;
