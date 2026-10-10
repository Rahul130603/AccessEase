import React, { useEffect, useId, useRef } from 'react';

import { useA11ySettingsContext, useAnnounce } from '../core/SettingsContext.jsx';
import VisuallyHidden from '../ui/VisuallyHidden.jsx';
import { useFormStyles } from './appStyles.js';

/**
 * Accessible field components (feature: accessible form labels).
 *
 * These exist so the application can fix labels *at the source* rather than have a
 * toolbar rename its controls at runtime. Design rules:
 *
 *  - A real `<label for>` is the default; ARIA is a fallback, not the mechanism.
 *    `aria-describedby` is used for hints and errors, which is the one thing a
 *    plain HTML pattern cannot express.
 *  - `required` uses the native attribute plus a visible marker and hidden
 *    "(required)" text, so the requirement never relies on colour alone.
 *  - Errors are real text in an element referenced by `aria-describedby`, and the
 *    control gets `aria-invalid="true"`. There is deliberately **no** live region on
 *    the error text: the recommended pattern is to move focus to the first invalid
 *    field (or an error summary) on submit, which makes a screen reader read the
 *    label, the value and the description in one go. `announceError` opts into one
 *    assertive announcement through the shared, deduplicated service for apps that
 *    cannot move focus.
 *  - Focus indication is never removed; the stylesheet adds a 3px outline.
 *  - `aria-errormessage` is intentionally not used: support is uneven, while
 *    `aria-describedby` plus `aria-invalid` works everywhere.
 */

function useFieldIds({ id, hint, error }) {
  const generatedId = useId();
  const controlId = id || `a11ytb-field-${generatedId.replace(/:/g, '')}`;
  const hintId = hint ? `${controlId}-hint` : null;
  const errorId = error ? `${controlId}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { controlId, hintId, errorId, describedBy };
}

/** Field wiring without rendering: spread `controlProps` on any control. */
export function useField({ id, hint, error, required = false }) {
  const ids = useFieldIds({ id, hint, error });
  return {
    ...ids,
    hasError: Boolean(error),
    controlProps: {
      id: ids.controlId,
      'aria-describedby': ids.describedBy,
      'aria-invalid': error ? true : undefined,
      required: required || undefined,
    },
  };
}

/**
 * Optional assertive announcement for a field error.
 *
 * Kept opt-in and routed through the shared service so that (a) identical messages
 * are deduplicated, (b) the user's verbosity setting is respected, and (c) two
 * fields failing at once cannot produce a chorus. The default recommendation stays
 * "move focus to the first invalid field", which is why the module default
 * (`forms.announceErrors`) is off.
 *
 * `enabled` wins when given; otherwise the user's setting decides.
 */
export function useFieldErrorAnnouncement({ error, label, controlId, enabled }) {
  const announce = useAnnounce();
  const context = useA11ySettingsContext();
  const settingsDefault = context ? context.settings.forms.announceErrors === true : false;
  const active = enabled === undefined ? settingsDefault : enabled === true;
  const previousErrorRef = useRef(error);

  useEffect(() => {
    const previous = previousErrorRef.current;
    previousErrorRef.current = error;
    if (!active || !error || error === previous) return;
    announce(`${label}: ${error}`, {
      politeness: 'assertive',
      level: 'critical',
      source: 'field',
      dedupeKey: `field-error:${controlId}`,
    });
  }, [error, active, label, announce, controlId]);
}

export function FieldError({ error, id, prefix = 'Error: ' }) {
  if (!error) return null;
  return (
    <p className="a11ytb-form__error" id={id}>
      <span className="a11ytb-form__error-label">{prefix}</span>
      {error}
    </p>
  );
}

export function FieldHint({ hint, id }) {
  if (!hint) return null;
  return (
    <p className="a11ytb-form__hint" id={id}>
      {hint}
    </p>
  );
}

/**
 * Wrapper that renders the label, hint and error around any control.
 * Pass a function as `children` to receive the wiring props.
 *
 * @example
 * <Field label="Email" hint="For the receipt only" error={errors.email} required>
 *   {(field) => <input type="email" value={email} onChange={...} {...field.controlProps} />}
 * </Field>
 */
export default function Field({
  label,
  hint,
  error,
  required = false,
  id,
  announceError = false,
  children,
  className = '',
}) {
  useFormStyles();
  const field = useField({ id, hint, error, required });
  useFieldErrorAnnouncement({
    error,
    label,
    controlId: field.controlId,
    enabled: announceError,
  });

  return (
    <div className={`a11ytb-form ${className}`.trim()}>
      <label className="a11ytb-form__label" htmlFor={field.controlId}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true"> *</span>
            <VisuallyHidden> (required)</VisuallyHidden>
          </>
        ) : null}
      </label>
      <FieldHint hint={hint} id={field.hintId} />
      {typeof children === 'function' ? children(field) : children}
      <FieldError error={error} id={field.errorId} />
    </div>
  );
}
