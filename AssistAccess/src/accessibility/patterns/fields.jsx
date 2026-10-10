import React from 'react';

import Field, { FieldError, FieldHint, useField, useFieldErrorAnnouncement } from './FormField.jsx';
import { useFormStyles } from './appStyles.js';

/**
 * Ready-made fields built on Field.
 *
 * Each one renders native, semantic markup: input/select/textarea/fieldset/legend
 * and label. The components do not add ARIA that the native element already
 * expresses, and they do not invent accessible names — if you leave the label out,
 * the field has no label, exactly as it would in plain HTML.
 */

export function TextField({
  label,
  hint,
  error,
  required = false,
  id,
  announceError = false,
  type = 'text',
  value,
  onChange,
  ...rest
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} announceError={announceError}>
      {(field) => (
        <input
          className="a11ytb-form__control"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value, event)}
          {...field.controlProps}
          {...rest}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required = false,
  id,
  announceError = false,
  rows = 4,
  value,
  onChange,
  ...rest
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} announceError={announceError}>
      {(field) => (
        <textarea
          className="a11ytb-form__control"
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value, event)}
          {...field.controlProps}
          {...rest}
        />
      )}
    </Field>
  );
}

/**
 * @param {object} props
 * @param {Array<{value: string, label: string}>} props.options
 * @param {string} [props.placeholderOption] an empty first option. It is *not* a
 *   label — the visible label above the control is still required.
 */
export function SelectField({
  label,
  hint,
  error,
  required = false,
  id,
  announceError = false,
  options = [],
  placeholderOption,
  value,
  onChange,
  ...rest
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} announceError={announceError}>
      {(field) => (
        <select
          className="a11ytb-form__control"
          value={value}
          onChange={(event) => onChange(event.target.value, event)}
          {...field.controlProps}
          {...rest}
        >
          {placeholderOption ? (
            <option value="" disabled>
              {placeholderOption}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Single checkbox or switch-like option: the label wraps the input. */
export function CheckboxField({
  label,
  hint,
  error,
  id,
  announceError = false,
  checked,
  onChange,
  ...rest
}) {
  useFormStyles();
  const field = useField({ id, hint, error });
  useFieldErrorAnnouncement({
    error,
    label,
    controlId: field.controlId,
    enabled: announceError,
  });

  return (
    <div className="a11ytb-form a11ytb-form--checkbox">
      <label className="a11ytb-form__choice">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked, event)}
          {...field.controlProps}
          {...rest}
        />
        <span className="a11ytb-form__choice-label">{label}</span>
      </label>
      <FieldHint hint={hint} id={field.hintId} />
      <FieldError error={error} id={field.errorId} />
    </div>
  );
}

/**
 * A set of radio buttons: the question goes in the legend, each option keeps its
 * own label. This is the pattern that prevents the classic "three unlabelled
 * radios" failure.
 *
 * @param {object} props
 * @param {string} props.legend the question these options answer
 * @param {Array<{value: string, label: string, hint?: string}>} props.options
 */
export function RadioGroupField({
  legend,
  hint,
  error,
  name,
  options = [],
  value,
  onChange,
  id,
  announceError = false,
  ...rest
}) {
  useFormStyles();
  const field = useField({ id, hint, error });
  useFieldErrorAnnouncement({
    error,
    label: legend,
    controlId: field.controlId,
    enabled: announceError,
  });

  return (
    <fieldset className="a11ytb-form__group" aria-describedby={field.describedBy} {...rest}>
      <legend className="a11ytb-form__group-legend">{legend}</legend>
      <FieldHint hint={hint} id={field.hintId} />
      {options.map((option, index) => (
        <label className="a11ytb-form__choice" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(event) => onChange(option.value, event)}
            aria-describedby={option.hint ? `${field.controlId}-option-${index}` : undefined}
          />
          <span className="a11ytb-form__choice-label">
            {option.label}
            {option.hint ? (
              <span className="a11ytb-form__hint" id={`${field.controlId}-option-${index}`}>
                {option.hint}
              </span>
            ) : null}
          </span>
        </label>
      ))}
      <FieldError error={error} id={field.errorId} />
    </fieldset>
  );
}

export { FieldError, FieldHint };
