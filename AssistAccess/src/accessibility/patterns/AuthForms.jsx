import React from 'react';

import PasswordField from './PasswordField.jsx';
import FormErrorSummary from './FormErrorSummary.jsx';
import { CheckboxField, TextField } from './fields.jsx';
import { useFormStyles } from './appStyles.js';
import StatusMessage from '../ui/StatusMessage.jsx';

/**
 * Example authentication forms (feature: accessible authentication).
 *
 * These are deliberately plain: controlled inputs, no state of their own, no network
 * calls and **no storage of any kind**. Values live in the caller's state and are
 * passed to the caller's submit handler. Nothing in this module writes a password,
 * a one-time code, a token or any other credential to accessibility preferences,
 * session storage or any other place — see INTEGRATION-FORMS.md for the checks that
 * verify it.
 *
 * What each form demonstrates:
 *  - the autocomplete value that lets browsers and password managers fill the field
 *    (username / current-password / new-password / one-time-code);
 *  - paste and password managers are never blocked;
 *  - a non-cognitive alternative is visible on the sign-in screen (3.3.8);
 *  - one-time codes use a single field with autocomplete, and never auto-submit;
 *  - errors go through the same summary + aria-describedby wiring as every other form.
 */

const LABELS = {
  signInTitle: 'Sign in',
  email: 'Email address',
  username: 'User name',
  password: 'Password',
  signIn: 'Sign in',
  forgot: 'Forgot your password?',
  emailLink: 'Email me a sign-in link instead',
  alternatives: 'Other ways to sign in',
  registrationTitle: 'Create an account',
  newPassword: 'Choose a password',
  repeatPassword: 'Repeat the password',
  passwordHint: 'At least 12 characters. Pasting from a password manager is allowed.',
  createAccount: 'Create account',
  resetTitle: 'Reset your password',
  resetIntro: 'Enter your email address and we will send you a reset link.',
  sendReset: 'Send the reset link',
  backToSignIn: 'Back to sign in',
  codeTitle: 'Enter your security code',
  code: 'Six-digit code',
  codeHint: 'From your authenticator app. It expires 10 minutes after it was sent.',
  backupCode: 'Or paste one of your backup codes',
  verify: 'Verify',
  resend: 'Send a new code',
  resendDone: 'A new code has been sent.',
  keepSignedIn: 'Keep me signed in on this device',
  working: 'Working…',
};

function FormHeading({ level, children }) {
  const Heading = `h${Math.min(6, Math.max(1, level))}`;
  return <Heading>{children}</Heading>;
}

function useMergedLabels(labels) {
  useFormStyles();
  return { ...LABELS, ...(labels || {}) };
}

/**
 * @param {object} props
 * @param {'signin'|'register'|'reset'|'otp'} [props.variant] title used for the heading
 */
export function SignInForm({
  values = {},
  onChange,
  onSubmit,
  errors = {},
  form,
  pending = false,
  onEmailLink,
  onForgotPassword,
  labels,
  headingLevel = 3,
  children,
}) {
  const copy = useMergedLabels(labels);
  return (
    <form
      className="a11ytb-auth"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      noValidate
    >
      <FormHeading level={headingLevel}>{copy.signInTitle}</FormHeading>
      {form ? <FormErrorSummary form={form} headingLevel={headingLevel + 1} /> : null}

      <TextField
        label={copy.email}
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={values.email || ''}
        onChange={(next) => onChange({ ...values, email: next })}
        error={errors.email}
        required
      />

      <PasswordField
        label={copy.password}
        autoComplete="current-password"
        value={values.password || ''}
        onChange={(next) => onChange({ ...values, password: next })}
        error={errors.password}
        required
      />

      <CheckboxField
        label={copy.keepSignedIn}
        checked={values.keepSignedIn === true}
        onChange={(next) => onChange({ ...values, keepSignedIn: next })}
      />

      <div className="a11ytb-button-row">
        <button type="submit" className="a11ytb-form__submit" disabled={pending}>
          {copy.signIn}
        </button>
      </div>

      {/* A non-cognitive alternative must be visible here, not buried in support pages. */}
      <ul className="a11ytb-auth__alternatives">
        <li>
          <button type="button" className="a11ytb-link-button" onClick={onForgotPassword}>
            {copy.forgot}
          </button>
        </li>
        <li>
          <button type="button" className="a11ytb-link-button" onClick={onEmailLink}>
            {copy.emailLink}
          </button>
        </li>
      </ul>

      {children}
      <StatusMessage className="a11ytb-status">{pending ? copy.working : ''}</StatusMessage>
    </form>
  );
}

export function RegistrationForm({
  values = {},
  onChange,
  onSubmit,
  errors = {},
  form,
  pending = false,
  labels,
  headingLevel = 3,
  children,
}) {
  const copy = useMergedLabels(labels);
  return (
    <form
      className="a11ytb-auth"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      noValidate
    >
      <FormHeading level={headingLevel}>{copy.registrationTitle}</FormHeading>
      {form ? <FormErrorSummary form={form} headingLevel={headingLevel + 1} /> : null}

      <TextField
        label={copy.email}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={values.email || ''}
        onChange={(next) => onChange({ ...values, email: next })}
        error={errors.email}
        required
      />

      {/* new-password on both boxes: that is what makes managers fill and paste work. */}
      <PasswordField
        label={copy.newPassword}
        hint={copy.passwordHint}
        autoComplete="new-password"
        value={values.password || ''}
        onChange={(next) => onChange({ ...values, password: next })}
        error={errors.password}
        required
      />

      <PasswordField
        label={copy.repeatPassword}
        autoComplete="new-password"
        value={values.repeatPassword || ''}
        onChange={(next) => onChange({ ...values, repeatPassword: next })}
        error={errors.repeatPassword}
        required
      />

      <div className="a11ytb-button-row">
        <button type="submit" className="a11ytb-form__submit" disabled={pending}>
          {copy.createAccount}
        </button>
      </div>

      {children}
      <StatusMessage className="a11ytb-status">{pending ? copy.working : ''}</StatusMessage>
    </form>
  );
}

export function PasswordResetForm({
  values = {},
  onChange,
  onSubmit,
  errors = {},
  form,
  pending = false,
  onBackToSignIn,
  labels,
  headingLevel = 3,
  children,
}) {
  const copy = useMergedLabels(labels);
  return (
    <form
      className="a11ytb-auth"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      noValidate
    >
      <FormHeading level={headingLevel}>{copy.resetTitle}</FormHeading>
      <p className="a11ytb-hint">{copy.resetIntro}</p>
      {form ? <FormErrorSummary form={form} headingLevel={headingLevel + 1} /> : null}

      {/* The identifier keeps autocomplete="username", so the manager can fill it here too. */}
      <TextField
        label={copy.email}
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={values.email || ''}
        onChange={(next) => onChange({ ...values, email: next })}
        error={errors.email}
        required
      />

      <div className="a11ytb-button-row">
        <button type="submit" className="a11ytb-form__submit" disabled={pending}>
          {copy.sendReset}
        </button>
        {onBackToSignIn ? (
          <button type="button" className="a11ytb-button" onClick={onBackToSignIn}>
            {copy.backToSignIn}
          </button>
        ) : null}
      </div>

      {children}
      <StatusMessage className="a11ytb-status">{pending ? copy.working : ''}</StatusMessage>
    </form>
  );
}

export function OneTimeCodeStep({
  values = {},
  onChange,
  onSubmit,
  onResend,
  errors = {},
  form,
  pending = false,
  resent = false,
  labels,
  headingLevel = 3,
  children,
}) {
  const copy = useMergedLabels(labels);
  return (
    <form
      className="a11ytb-auth"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      noValidate
    >
      <FormHeading level={headingLevel}>{copy.codeTitle}</FormHeading>
      {form ? <FormErrorSummary form={form} headingLevel={headingLevel + 1} /> : null}

      {/* One field, not six: autofill, screen readers and magnifiers all behave better. */}
      <TextField
        label={copy.code}
        hint={copy.codeHint}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        value={values.code || ''}
        onChange={(next) => onChange({ ...values, code: next })}
        error={errors.code}
        required
      />

      <TextField
        label={copy.backupCode}
        type="text"
        autoComplete="one-time-code"
        value={values.backupCode || ''}
        onChange={(next) => onChange({ ...values, backupCode: next })}
        error={errors.backupCode}
      />

      <div className="a11ytb-button-row">
        {/* No auto-submit when the code is complete: the user checks it, then sends it. */}
        <button type="submit" className="a11ytb-form__submit" disabled={pending}>
          {copy.verify}
        </button>
        <button type="button" className="a11ytb-button" onClick={onResend} disabled={pending}>
          {copy.resend}
        </button>
      </div>

      {children}
      <StatusMessage className="a11ytb-status">
        {pending ? copy.working : resent ? copy.resendDone : ''}
      </StatusMessage>
    </form>
  );
}

export { LABELS as authFormLabels };
