/**
 * PasswordField — password input with an accessible show/hide control (feature 9).
 *
 * Guarantees
 * ----------
 *  - The toggle is a real button, reachable in DOM order right after the field, with a
 *    24px minimum target and the shared focus ring.
 *  - `aria-pressed` carries the state, the accessible name says which field it belongs
 *    to ("Show password for Password"), and `aria-controls` points at the input.
 *  - Only the `type` attribute changes, so the value, the browser's autofill state and
 *    the form association are untouched; the caret position is restored afterwards.
 *  - The announcement reports the state ("Password shown"), never the value. The value
 *    is never copied into state that is persisted, logged or exported.
 *  - Visibility is off until the user asks for it. The `forms.passwordToggle` setting,
 *    which the user controls in the toolbar, turns the control off entirely.
 *
 * @example
 * import PasswordField from './accessibility/PasswordField';
 *
 * <PasswordField
 *   label="Password"
 *   autoComplete="current-password"      // "new-password" when creating one
 *   value={password}
 *   onChange={setPassword}
 *   error={form.errors.password}
 *   hint="At least 12 characters. Pasting from a password manager is allowed."
 * />
 */

export { default } from './patterns/PasswordField.jsx';
export { default as PasswordField } from './patterns/PasswordField.jsx';
