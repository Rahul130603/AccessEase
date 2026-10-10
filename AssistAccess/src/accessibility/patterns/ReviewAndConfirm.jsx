import React from 'react';

import { useFormStyles } from './appStyles.js';

/**
 * Review step for consequential submissions (WCAG 3.3.4 Error Prevention).
 *
 * For legal, financial or data-destroying submissions the requirement is that the
 * user can review, correct and confirm before the action takes effect. A confirmation
 * dialog alone is not enough: the user has to be able to *see what they are about to
 * send*, and to get back to the step that needs changing.
 *
 * The summary is a real definition list, so a screen reader hears each label with its
 * value, and the edit control returns to the form rather than losing the data.
 */
export default function ReviewAndConfirm({
  title,
  items = [],
  onEdit,
  editLabel = 'Change these details',
  confirmLabel = 'Confirm and send',
  onConfirm,
  note,
  pending = false,
  headingLevel = 3,
  className = '',
}) {
  useFormStyles();
  const Heading = `h${Math.min(6, Math.max(1, Number(headingLevel) || 3))}`;

  return (
    <section className={`a11ytb-review ${className}`.trim()}>
      <Heading className="a11ytb-review__title">{title}</Heading>
      {note ? <p className="a11ytb-hint">{note}</p> : null}

      {items.length ? (
        <dl className="a11ytb-review__list">
          {items.map((item) => (
            <React.Fragment key={item.label}>
              <dt className="a11ytb-review__term">{item.label}</dt>
              <dd className="a11ytb-review__value">{item.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-form__submit" onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </button>
        {onEdit ? (
          <button type="button" className="a11ytb-button" onClick={onEdit} disabled={pending}>
            {editLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
