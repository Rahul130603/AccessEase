import React, { useEffect, useRef, useState } from 'react';

import { warnDev } from '../core/warnDev.js';
import { VISUALLY_HIDDEN_STYLE } from './visuallyHiddenStyle.js';

/**
 * Status message — the reusable, self-announcing live region.
 *
 * Semantics first
 * ---------------
 *  - `role="status"` is used for confirmations and progress. It *implies*
 *    `aria-live="polite"`, so no aria-live attribute is added: redundant ARIA is
 *    noise that has to be maintained.
 *  - `role="alert"` is offered for messages that must interrupt. Use it sparingly;
 *    an alert that fires on every keystroke makes a form unusable with a screen
 *    reader.
 *  - `aria-atomic="true"` is set explicitly. It is part of the implicit semantics
 *    of both roles, but support for the implicit value has been uneven, and the
 *    attribute is what guarantees the whole sentence is read instead of only the
 *    changed word.
 *  - `role="none"` turns the element into a plain custom region with an explicit
 *    `aria-live` value, for the rare case where neither role fits.
 *
 * The region-before-message rule
 * ------------------------------
 * A live region that is inserted together with its text is frequently missed: the
 * element and the text appear in the same frame, so there is no change for
 * assistive technology to observe. This component therefore renders an empty
 * region first and fills it on the next tick. That one-frame gap is imperceptible
 * visually and is what makes the announcement reliable.
 *
 * One channel per message
 * -----------------------
 * Do not render this component *and* call the toolbar's `announce()` for the same
 * message: it will be spoken twice. Use `StatusMessage` when there is something on
 * screen, and `announce()` / `useAnnounce()` when there is not. The toolbar's
 * service drops exact repeats within 1.5 seconds as a backstop, not as a design.
 */
export default function StatusMessage({
  children,
  role = 'status',
  politeness,
  atomic = true,
  visible = true,
  as: Tag = 'p',
  className = '',
  ...rest
}) {
  const [text, setText] = useState('');
  const firstRef = useRef(true);

  if (role !== 'none' && politeness) {
    warnDev(
      'status-message-politeness',
      'StatusMessage: the politeness prop is ignored when role is "status" or "alert" — the role already defines it. Pass role="none" if you need an explicit aria-live value.',
    );
  }

  useEffect(() => {
    const next = children === null || children === undefined ? '' : String(children);
    if (next === text) return undefined;
    if (firstRef.current) {
      firstRef.current = false;
      const timer = setTimeout(() => setText(next), 0);
      return () => clearTimeout(timer);
    }
    setText(next);
    return undefined;
  }, [children, text]);

  const aria = {};
  if (role === 'none') {
    aria['aria-live'] = politeness === 'assertive' ? 'assertive' : politeness === 'off' ? 'off' : 'polite';
    aria['aria-atomic'] = atomic ? 'true' : 'false';
  } else if (atomic) {
    aria['aria-atomic'] = 'true';
  }

  return (
    <Tag
      className={className}
      role={role === 'none' ? undefined : role}
      style={visible ? undefined : VISUALLY_HIDDEN_STYLE}
      data-a11ytb-status=""
      {...aria}
      {...rest}
    >
      {text}
    </Tag>
  );
}
