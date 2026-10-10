import React, { useId } from 'react';

/**
 * Switch control (APG "Switch" pattern).
 *
 * Accessibility notes:
 *  - `role="switch"` + `aria-checked` carries the state programmatically, so the
 *    visible "On/Off" text is hidden from assistive technology to avoid it being
 *    announced twice.
 *  - The accessible name comes from `aria-labelledby` pointing at the visible
 *    label inside the button (2.5.3 Label in Name: the visible text is contained
 *    in the accessible name).
 *  - The track is decorative and marked `aria-hidden`.
 */
export default function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  onLabel = 'On',
  offLabel = 'Off',
}) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="a11ytb-row">
      <button
        type="button"
        role="switch"
        className="a11ytb-switch"
        aria-checked={checked === true}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="a11ytb-switch__track" aria-hidden="true">
          <span className="a11ytb-switch__thumb" />
        </span>
        <span className="a11ytb-switch__text">
          <span className="a11ytb-switch__label" id={labelId}>
            {label}
          </span>
          <span className="a11ytb-switch__state" aria-hidden="true">
            {checked ? onLabel : offLabel}
          </span>
        </span>
      </button>
      {description ? (
        <p className="a11ytb-hint" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
