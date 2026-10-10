import React, { useRef, useState } from 'react';

import { useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import FormErrorSummary, { useFormErrors } from '../../patterns/FormErrorSummary.jsx';
import PasswordField from '../../patterns/PasswordField.jsx';
import ReviewAndConfirm from '../../patterns/ReviewAndConfirm.jsx';
import { TextField } from '../../patterns/fields.jsx';
import { OneTimeCodeStep, PasswordResetForm, RegistrationForm, SignInForm } from '../../patterns/AuthForms.jsx';
import { useAnnounce } from '../../core/SettingsContext.jsx';
import { useFormStyles } from '../../patterns/appStyles.js';

/**
 * Form fixtures for the four features of this phase.
 *
 * Everything here is local and inert: no network call, no storage, no real data. The
 * forms exist so the focus behaviour, the announcement behaviour and the audit
 * findings can be exercised by hand.
 */

function validateDemo(values) {
  const problems = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email || '')) {
    problems['demo-email'] = 'Enter an email address in the form name@example.com.';
  }
  if ((values.password || '').length < 12) {
    problems['demo-password'] = 'Use at least 12 characters. Three or four unrelated words is easiest to remember.';
  }
  if (values.password && values.repeat && values.password !== values.repeat) {
    problems['demo-repeat'] = 'The two passwords do not match.';
  }
  return problems;
}

export function ErrorSummaryFixture() {
  useFormStyles();
  const formRef = useRef(null);
  const form = useFormErrors({ formRef });
  const [values, setValues] = useState({ email: '', password: '', repeat: '' });
  const [saved, setSaved] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    const problems = validateDemo(values);
    if (Object.keys(problems).length > 0) {
      form.handleFailure(problems); // stores the messages and focuses the summary, once
      return;
    }
    setSaved('Account details accepted. Nothing was sent anywhere.');
    form.clearAll();
  };

  return (
    <div>
      <h3>Error summary and field errors</h3>
      <p>
        Submit with an empty or invalid form. Expected: focus moves to the summary and it is read
        once; each field carries <code>aria-invalid=&quot;true&quot;</code> and a message wired with{' '}
        <code>aria-describedby</code>; no live-region announcement is added on top.
      </p>

      <form className="a11ytb-auth" onSubmit={onSubmit} ref={formRef} noValidate>
        <FormErrorSummary form={form} />

        <TextField
          id="demo-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={values.email}
          error={form.errors['demo-email']}
          onChange={(next) => {
            setValues((current) => ({ ...current, email: next }));
            form.clear('demo-email');
          }}
          required
        />

        <PasswordField
          id="demo-password"
          label="Choose a password"
          hint="At least 12 characters. Pasting from a password manager is allowed."
          autoComplete="new-password"
          value={values.password}
          error={form.errors['demo-password']}
          onChange={(next) => {
            setValues((current) => ({ ...current, password: next }));
            form.clear('demo-password');
          }}
          required
        />

        <PasswordField
          id="demo-repeat"
          label="Repeat the password"
          autoComplete="new-password"
          value={values.repeat}
          error={form.errors['demo-repeat']}
          onChange={(next) => {
            setValues((current) => ({ ...current, repeat: next }));
            form.clear('demo-repeat');
          }}
          required
        />

        <div className="a11ytb-button-row">
          <button type="submit" className="a11ytb-form__submit">
            Create the demo account
          </button>
        </div>
      </form>

      {saved ? <p className="a11ytb-status">{saved}</p> : null}

      <p className="harness-note">
        After typing a password, run this in the console and confirm it returns nothing:{' '}
        <code>
          JSON.stringify(localStorage).includes(document.getElementById(&apos;demo-password&apos;).value)
        </code>
        . The password exists only inside the input element.
      </p>
    </div>
  );
}

export function PasswordVisibilityFixture() {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(null);

  return (
    <div>
      <h3>Show and hide password</h3>
      <p>
        Tab to the field, then to the Show button. Expected: the button reports its state with
        aria-pressed, its name says which field it belongs to, the value and caret are preserved
        across the switch, and the announcement says “Password shown” — never the value.
        {visible === null ? '' : ` Last requested state: ${visible ? 'shown' : 'hidden'}.`}
      </p>
      <PasswordField
        id="visibility-demo"
        label="Password"
        autoComplete="current-password"
        value={value}
        onChange={setValue}
        onVisibilityChange={setVisible}
        hint="Type something, toggle twice, and confirm the text is still there."
      />
    </div>
  );
}

export function AuthExamplesFixture() {
  const [signIn, setSignIn] = useState({ email: '', password: '', keepSignedIn: false });
  const [register, setRegister] = useState({ email: '', password: '', repeatPassword: '' });
  const [reset, setReset] = useState({ email: '' });
  const [code, setCode] = useState({ code: '', backupCode: '' });
  const [note, setNote] = useState('');
  const announce = useAnnounce();

  return (
    <div>
      <h3>Authentication examples</h3>
      <p>
        These are the patterns the audit asks for on other sites: the right autocomplete values,
        paste allowed everywhere, one field for one-time codes, and a non-cognitive alternative on
        the sign-in screen. Nothing is submitted, and nothing is stored.
      </p>

      <SignInForm
        values={signIn}
        onChange={setSignIn}
        onSubmit={() => setNote('Sign-in submitted (demo only).')}
        onEmailLink={() => setNote('A sign-in link would be emailed (demo only).')}
        onForgotPassword={() => setNote('The reset form is below (demo only).')}
      />

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">Registration example</summary>
        <RegistrationForm
          values={register}
          onChange={setRegister}
          onSubmit={() => setNote('Registration submitted (demo only).')}
        />
      </details>

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">Password reset example</summary>
        <PasswordResetForm
          values={reset}
          onChange={setReset}
          onSubmit={() => setNote('Reset link requested (demo only).')}
          onBackToSignIn={() => setNote('Back to sign in (demo only).')}
        />
      </details>

      <details className="a11ytb-details">
        <summary className="a11ytb-details__summary">One-time code example</summary>
        <OneTimeCodeStep
          values={code}
          onChange={setCode}
          onSubmit={() => setNote('Code submitted (demo only).')}
          onResend={() => {
            setNote('A new code would be sent (demo only).');
            announce('A new code would be sent. This is a demo, so nothing was sent.', {
              level: 'standard',
              source: 'harness',
            });
          }}
        />
      </details>

      {note ? <p className="a11ytb-status">{note}</p> : null}
    </div>
  );
}

export function ConfirmationFixture() {
  const confirm = useConfirm();
  const announce = useAnnounce();
  const [reportDeleted, setReportDeleted] = useState(false);
  const [reviewStep, setReviewStep] = useState(false);
  const [sent, setSent] = useState('');

  const deleteReport = async () => {
    const accepted = await confirm({
      title: 'Delete the quarterly report?',
      description: 'The report and its 14 comments are removed for everyone on the team.',
      details: ['14 comments will be deleted', 'Shared links will stop working', 'This cannot be undone'],
      confirmLabel: 'Delete the report',
      cancelLabel: 'Keep the report',
      destructive: true,
    });
    if (!accepted) return;
    setReportDeleted(true);
    announce('The demo report was deleted. Nothing real was removed.', {
      level: 'standard',
      source: 'harness',
    });
  };

  return (
    <div>
      <h3>Confirmation dialog</h3>
      <p>
        Activate the destructive button. Expected: a modal dialog named “Delete the quarterly
        report?” with its description and details; focus starts on “Keep the report”; Escape and a
        backdrop press both cancel; focus returns to the button that opened it either way; the
        dialog reads once — no separate announcement.
      </p>

      <div className="a11ytb-button-row">
        <button
          type="button"
          className="a11ytb-form__submit"
          onClick={deleteReport}
          disabled={reportDeleted}
        >
          Delete the quarterly report
        </button>
      </div>
      {reportDeleted ? <p className="a11ytb-status">The demo report has been deleted.</p> : null}

      <div className="a11ytb-button-row">
        <button type="button" className="a11ytb-button" onClick={() => setReviewStep(true)}>
          Start a transfer (review step)
        </button>
      </div>

      {reviewStep ? (
        <ReviewAndConfirm
          title="Review your transfer"
          note="Check the details, then confirm. This is the 3.3.4 review step for financial data."
          items={[
            { label: 'From', value: 'Current account' },
            { label: 'To', value: 'GB29 NWBK 6016 1331 9268 19' },
            { label: 'Amount', value: '1,250.00 GBP' },
            { label: 'Arrives', value: 'Tomorrow before 5pm' },
          ]}
          onEdit={() => setReviewStep(false)}
          confirmLabel="Send 1,250.00 GBP"
          onConfirm={() => {
            setSent('The demo transfer was confirmed. Nothing was sent.');
            setReviewStep(false);
          }}
        />
      ) : null}
      {sent ? <p className="a11ytb-status">{sent}</p> : null}
    </div>
  );
}

/** Deliberate authentication defects for the audit to find. */
export function AuthDefectsFixture() {
  const pasteBlockerRef = useRef(null);

  return (
    <div>
      <h3>Deliberate authentication defects — the audit should report these</h3>
      <p>
        No autocomplete on the credential fields (detected), autocomplete=&quot;off&quot; (detected),
        an inline paste blocker (detected), and a captcha-style block with a transcription
        instruction (review items).
      </p>

      <form className="a11ytb-auth" method="post" action="#">
        <p>
          <label htmlFor="defect-user">User name</label>
          <input id="defect-user" name="username" type="text" />
        </p>
        <p>
          <label htmlFor="defect-pass">Password</label>
          {/* autocomplete="off" is exactly what breaks password managers */}
          <input id="defect-pass" name="password" type="password" autoComplete="off" />
        </p>
        <p>
          <label htmlFor="defect-recover">Recovery code</label>
          {/*
            React sets handlers as listeners, not as inline attributes, so the fixture
            writes the attribute itself: the audit looks for the inline blocker a site
            would ship.
          */}
          <input
            id="defect-recover"
            name="recovery"
            type="text"
            ref={(node) => {
              pasteBlockerRef.current = node;
              if (node) node.setAttribute('onpaste', 'return false');
            }}
          />
        </p>

        <div className="captcha-challenge">
          <label htmlFor="defect-captcha">Type the third character of your password</label>
          <input id="defect-captcha" name="captcha" type="text" />
        </div>
      </form>
    </div>
  );
}

export default ErrorSummaryFixture;
