import React, { useCallback, useId, useMemo, useRef, useState } from 'react';

import { useA11ySettingsContext, useAnnounce } from '../core/SettingsContext.jsx';
import { formatMessage } from '../strings.js';
import { useFormStyles } from './appStyles.js';

/**
 * Form-level error summary and the state that drives it (feature: accessible error
 * messages).
 *
 * Why the summary receives focus instead of being a live region
 * ------------------------------------------------------------
 * A summary that is announced *and* focused is read twice. The documented pattern —
 * focusable container, focused once on a failed submission — gives exactly one
 * utterance that includes every problem and a link to each field, and it works in
 * browsers and screen readers where live regions are unreliable during a submit.
 * `role="alert"` is therefore opt-in (`announceOnMount`) for the rare case where a
 * form genuinely cannot move focus.
 *
 * Why the links are real links
 * ----------------------------
 * Each entry is an `<a href="#fieldId">`, so the relationship is expressed in
 * markup and the browser's own "link to a target" semantics apply. The click handler
 * only intercepts to move focus without pushing a new history entry for a form the
 * user has not left.
 */

const FALLBACK_COPY = {
  summaryTitle: 'There is a problem',
  announceSummary: 'There is a problem. {count} field(s) need attention.',
};

/**
 * Error state, summary focus and field focus for one form.
 *
 * @param {{formRef?: React.RefObject<HTMLFormElement>}} [options] the form element,
 *   used to resolve fields by name as well as by id (native form association).
 */
export function useFormErrors({ formRef } = {}) {
  const [errors, setErrors] = useState({});
  const summaryRef = useRef(null);
  const announce = useAnnounce();
  const context = useA11ySettingsContext();
  const announceErrors = context ? context.settings.forms.announceErrors === true : false;
  const copy = (context && context.strings.errors) || FALLBACK_COPY;

  const items = useMemo(
    () => Object.keys(errors).map((fieldId) => ({ fieldId, message: errors[fieldId] })),
    [errors],
  );

  /** Move focus to a field by id, or by name through the form element. */
  const focusField = useCallback(
    (fieldKey) => {
      if (!fieldKey) return false;
      const byId = typeof document !== 'undefined' ? document.getElementById(fieldKey) : null;
      const form = formRef && formRef.current;
      const byName = form && form.elements ? form.elements.namedItem(fieldKey) : null;
      const node = byId || (byName && typeof byName.focus === 'function' ? byName : null);
      if (node && typeof node.focus === 'function') {
        node.focus();
        return true;
      }
      return false;
    },
    [formRef],
  );

  /**
   * Focus the summary. React may not have committed the rendered summary yet when a
   * submit handler runs, so this retries over a couple of frames.
   */
  const focusSummary = useCallback(() => {
    let attempts = 3;
    const attempt = () => {
      const node = summaryRef.current;
      if (node && typeof node.focus === 'function') {
        node.focus();
        return;
      }
      attempts -= 1;
      if (attempts > 0 && typeof requestAnimationFrame === 'function') requestAnimationFrame(attempt);
    };
    attempt();
  }, []);

  const clear = useCallback((fieldId) => {
    setErrors((previous) => {
      if (!(fieldId in previous)) return previous;
      const next = { ...previous };
      delete next[fieldId];
      return next;
    });
  }, []);

  const setError = useCallback((fieldId, message) => {
    setErrors((previous) => ({ ...previous, [fieldId]: message }));
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  /**
   * Call from a failed submit: store the messages, focus the summary, and — only if
   * the user asked for it — announce the summary once.
   */
  const handleFailure = useCallback(
    (nextErrors = {}) => {
      const count = Object.keys(nextErrors).length;
      setErrors(nextErrors);
      focusSummary();
      if (announceErrors && count > 0) {
        announce(formatMessage(copy.announceSummary || FALLBACK_COPY.announceSummary, { count }), {
          politeness: 'assertive',
          level: 'critical',
          source: 'form',
          dedupeKey: 'form.summary',
        });
      }
      return count;
    },
    [announceErrors, announce, copy, focusSummary],
  );

  return {
    errors,
    items,
    count: items.length,
    summaryRef,
    setErrors,
    setError,
    clear,
    clearAll,
    focusField,
    focusSummary,
    handleFailure,
  };
}

/**
 * @param {object} props
 * @param {ReturnType<typeof useFormErrors>} props.form the object from useFormErrors
 * @param {string} [props.title] overrides "There is a problem"
 * @param {number} [props.headingLevel] heading level for the title (default 2)
 * @param {boolean} [props.announceOnMount] add role="alert" for forms that cannot move focus
 */
export default function FormErrorSummary({
  form,
  title,
  headingLevel = 2,
  id,
  announceOnMount = false,
  className = '',
}) {
  useFormStyles();
  const context = useA11ySettingsContext();
  const copy = (context && context.strings.errors) || FALLBACK_COPY;
  const items = (form && form.items) || [];
  // A per-instance id: two forms on one page must not share the default literal, or
  // the second summary would be addressed by the first one's id.
  const generatedId = useId();
  const summaryId = id || `a11ytb-error-summary-${generatedId.replace(/:/g, '')}`;

  if (items.length === 0) return null;

  const Heading = `h${Math.min(6, Math.max(1, Number(headingLevel) || 2))}`;

  return (
    <div
      className={`a11ytb-error-summary ${className}`.trim()}
      id={summaryId}
      tabIndex={-1}
      ref={form ? form.summaryRef : undefined}
      role={announceOnMount ? 'alert' : undefined}
    >
      <Heading className="a11ytb-error-summary__title">{title || copy.summaryTitle}</Heading>
      <ul className="a11ytb-error-summary__list">
        {items.map((item) => (
          <li key={item.fieldId || item.message}>
            <a
              className="a11ytb-error-summary__link"
              href={`#${item.fieldId}`}
              onClick={(event) => {
                // Focus the field without adding a history entry; the href stays for
                // semantics, keyboard use and "copy link" affordances.
                if (form && form.focusField(item.fieldId)) event.preventDefault();
              }}
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
