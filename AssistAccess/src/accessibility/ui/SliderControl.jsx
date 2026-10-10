import React, { useId } from 'react';

/**
 * Range slider with a real <label> and an explicit value text.
 *
 * Accessibility notes:
 *  - A native `input[type=range]` is used on purpose: keyboard support (arrows,
 *    Page Up/Down, Home/End) and value announcement come from the platform.
 *  - `aria-valuetext` gives the value a unit ("120 percent") instead of a bare
 *    number, which is what a screen reader would otherwise read out.
 *  - The visible value is `aria-hidden` so it is not announced twice.
 *  - The hint that explains the keyboard interaction is part of
 *    `aria-describedby`, not a tooltip.
 */
export default function SliderControl({
  label,
  description,
  hint,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (current) => String(current),
  formatValueText = (current) => `${current} percent`,
  disabled = false,
}) {
  const inputId = useId();
  const descriptionId = useId();
  const hintId = useId();

  const describedBy =
    [description ? descriptionId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="a11ytb-field">
      <div className="a11ytb-field__header">
        <label className="a11ytb-field__label" htmlFor={inputId}>
          {label}
        </label>
        <span className="a11ytb-field__value" aria-hidden="true">
          {formatValue(value)}
        </span>
      </div>
      {description ? (
        <p className="a11ytb-hint" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hint ? (
        <p className="a11ytb-hint a11ytb-hint--small" id={hintId}>
          {hint}
        </p>
      ) : null}
      <input
        className="a11ytb-slider"
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={formatValueText(value)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
