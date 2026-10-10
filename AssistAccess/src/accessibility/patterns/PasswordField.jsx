import React, { useCallback, useRef, useState } from 'react';

import { useA11ySettingsContext, useAnnounce } from '../core/SettingsContext.jsx';
import { formatMessage } from '../strings.js';
import Field from './FormField.jsx';
import { useFormStyles } from './appStyles.js';

/**
 * Password field with a show/hide control (feature: show / hide password).
 *
 * Guarantees, and how each one is kept
 * ------------------------------------
 *  - **The value never moves.** Only the `type` attribute changes on the same input
 *    element, so the value, the browser's autofill state and the form association
 *    are untouched. The value is never copied into component state, never put in a
 *    label, never announced and never written to storage.
 *  - **The control is usable.** It is a real button after the input in the DOM (so
 *    Tab order is field → button even though CSS places it inside the field), with
 *    a 24px minimum target and the shared focus indicator.
 *  - **The state is announced.** `aria-pressed` carries it programmatically, the
 *    accessible name says which field it belongs to, and the change is announced
 *    through the shared service as "Password shown" — never the value.
 *  - **Visibility is off until asked for.** Nothing toggles it automatically, and
 *    the caret position is restored after the switch so typing can continue.
 *
 * The component is opt-out through the forms setting `passwordToggle`, which the
 * user controls from the toolbar panel.
 */
export default function PasswordField({
  label,
  hint,
  error,
  required = false,
  id,
  name,
  value,
  onChange,
  autoComplete = 'current-password',
  visible: visibleProp,
  onVisibilityChange,
  showToggle,
  toggleLabels,
  disabled = false,
  readOnly = false,
  announceError,
  className = '',
  ...rest
}) {
  useFormStyles();
  const context = useA11ySettingsContext();
  const announce = useAnnounce();
  const copy = (context && context.strings.password) || null;

  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = visibleProp !== undefined;
  const visible = isControlled ? visibleProp === true : internalVisible;

  const settingsAllowToggle = context ? context.settings.forms.passwordToggle !== false : true;
  const toggleEnabled = showToggle === undefined ? settingsAllowToggle : showToggle === true;

  const inputRef = useRef(null);

  const labels = {
    show: (toggleLabels && toggleLabels.show) || (copy && copy.showLabel) || 'Show',
    hide: (toggleLabels && toggleLabels.hide) || (copy && copy.hideLabel) || 'Hide',
    ariaShow: (copy && copy.ariaShow) || 'Show password for {label}',
    ariaHide: (copy && copy.ariaHide) || 'Hide password for {label}',
  };

  const toggle = useCallback(() => {
    const node = inputRef.current;
    const next = !visible;
    // Remember the caret: changing type resets the selection in some browsers.
    const start = node && typeof node.selectionStart === 'number' ? node.selectionStart : null;
    const end = node && typeof node.selectionEnd === 'number' ? node.selectionEnd : null;

    if (isControlled) {
      if (typeof onVisibilityChange === 'function') onVisibilityChange(next);
    } else {
      setInternalVisible(next);
      if (typeof onVisibilityChange === 'function') onVisibilityChange(next);
    }

    announce(next ? (copy && copy.showAnnouncement) || 'Password shown.' : (copy && copy.hideAnnouncement) || 'Password hidden.', {
      level: 'standard',
      source: 'password',
      dedupeKey: 'password.visibility',
    });

    if (start !== null && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        const current = inputRef.current;
        if (!current || typeof current.setSelectionRange !== 'function') return;
        if (typeof document !== 'undefined' && document.activeElement !== current) return;
        try {
          current.setSelectionRange(start, end === null ? start : end);
        } catch (error) {
          /* type may not support selection in this browser */
        }
      });
    }
  }, [visible, isControlled, onVisibilityChange, announce, copy]);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      id={id}
      announceError={announceError}
      className={className}
    >
      {(field) => (
        <div className={`a11ytb-password${toggleEnabled ? ' a11ytb-password--with-toggle' : ''}`}>
          <input
            ref={inputRef}
            className="a11ytb-form__control"
            type={visible ? 'text' : 'password'}
            value={value}
            name={name}
            autoComplete={autoComplete}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            disabled={disabled}
            readOnly={readOnly}
            onChange={(event) => onChange(event.target.value, event)}
            {...field.controlProps}
            {...rest}
          />
          {toggleEnabled ? (
            <button
              type="button"
              className="a11ytb-password__toggle"
              aria-pressed={visible}
              aria-controls={field.controlId}
              aria-label={formatMessage(visible ? labels.ariaHide : labels.ariaShow, { label })}
              onClick={toggle}
              disabled={disabled || readOnly}
            >
              {visible ? labels.hide : labels.show}
            </button>
          ) : null}
        </div>
      )}
    </Field>
  );
}
