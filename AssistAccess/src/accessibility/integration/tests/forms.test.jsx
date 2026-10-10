/**
 * Forms, passwords and confirmation — Vitest + RTL + axe.
 *
 * Covers the three interaction contracts the review asks about explicitly: error
 * association (aria-describedby + aria-invalid, one focus move, no duplicate
 * announcement), password-toggle behaviour (type switch, state, value preserved,
 * announcement without the value), and dialog focus handling (focus into the dialog,
 * Escape to cancel, focus returned to the invoking control).
 *
 * The confirmation tests exercise the component's documented fallback, because jsdom does
 * not implement `showModal()`. Call `mockShowModal()` from the setup file to run the same
 * flows through the native path.
 *
 * STATUS: authored, NOT executed in the review environment. Run with `npx vitest run`.
 */

import React, { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

import { AccessibilityProvider } from '../../index.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { ConfirmProvider, useConfirm } from '../../core/confirm/ConfirmContext.jsx';
import ConfirmButton from '../../ui/ConfirmButton.jsx';
import Field, { TextField } from '../../patterns/FormField.jsx';
import FormErrorSummary, { useFormErrors } from '../../patterns/FormErrorSummary.jsx';
import PasswordField from '../../patterns/PasswordField.jsx';

function Providers({ children }) {
  return (
    <AccessibilityProvider config={{ storage: 'memory' }}>{children}</AccessibilityProvider>
  );
}

const politeRegion = () => document.getElementById('a11ytb-live-polite');

// ── Error messages ─────────────────────────────────────────────────────────
function ErrorForm() {
  const form = useFormErrors();
  const [email, setEmail] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.includes('@')) form.handleFailure({ email: 'Enter an address in the form name@example.com.' });
      }}
      noValidate
    >
      <FormErrorSummary form={form} />
      <TextField
        id="email"
        label="Email address"
        hint="We only use this for the receipt."
        value={email}
        error={form.errors.email}
        onChange={(next) => {
          setEmail(next);
          form.clear('email');
        }}
      />
      <button type="submit">Send</button>
    </form>
  );
}

describe('accessible error messages', () => {
  it('associates the message with the field and marks it invalid', async () => {
    const user = userEvent.setup();
    render(<ErrorForm />, { wrapper: Providers });

    await user.click(screen.getByRole('button', { name: 'Send' }));

    const field = screen.getByLabelText('Email address');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Error: Enter an address/);
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument();
  });

  it('moves focus to the summary once, and does not also announce it', async () => {
    const user = userEvent.setup();
    render(<ErrorForm />, { wrapper: Providers });

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'There is a problem' }).closest('div')).toHaveFocus();
    });
    // The default is one channel: focus reads the summary, the live region stays quiet.
    expect(politeRegion().textContent).not.toMatch(/There is a problem/);
  });

  it('links each summary entry to its field', async () => {
    const user = userEvent.setup();
    render(<ErrorForm />, { wrapper: Providers });
    await user.click(screen.getByRole('button', { name: 'Send' }));

    const link = screen.getByRole('link', { name: /Enter an address/ });
    expect(link).toHaveAttribute('href', '#email');
    await user.click(link);
    expect(screen.getByLabelText('Email address')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<ErrorForm />, { wrapper: Providers });
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await axe(baseElement)).toHaveNoViolations();
  });

  it('renders the message as real text, not as generated content', async () => {
    const user = userEvent.setup();
    render(<ErrorForm />, { wrapper: Providers });
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });
});

// ── Password toggle ────────────────────────────────────────────────────────
function PasswordHarness() {
  const [value, setValue] = useState('correct horse battery staple');
  return (
    <Providers>
      <PasswordField id="password" label="Password" autoComplete="current-password" value={value} onChange={setValue} />
    </Providers>
  );
}

describe('show / hide password', () => {
  it('switches the input type, exposes its state and keeps the value', async () => {
    const user = userEvent.setup();
    render(<PasswordHarness />);

    const field = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: /Show password for Password/ });
    expect(field).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(field).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password for Password/ })).toHaveAttribute('aria-pressed', 'true');
    expect(field).toHaveValue('correct horse battery staple');
  });

  it('announces the state and never the value', async () => {
    const user = userEvent.setup();
    render(<PasswordHarness />);
    await user.click(screen.getByRole('button', { name: /Show password/ }));

    await waitFor(() => expect(politeRegion().textContent).toMatch(/Password shown/));
    expect(politeRegion().textContent).not.toMatch(/correct horse/);
  });

  it('names the control after the field it belongs to', () => {
    render(<PasswordHarness />);
    const toggle = screen.getByRole('button', { name: /Show password for Password/ });
    expect(toggle).toHaveAttribute('aria-controls', 'password');
  });
});

// ── Confirmation ───────────────────────────────────────────────────────────
function DestructiveAction({ onConfirm }) {
  const confirm = useConfirm();
  const buttonRef = useRef(null);
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={async () => {
        const ok = await confirm({
          title: 'Delete the report?',
          description: 'The report and its comments are removed.',
          details: ['14 comments will be deleted'],
          confirmLabel: 'Delete the report',
          cancelLabel: 'Keep the report',
          destructive: true,
        });
        if (ok) onConfirm();
      }}
    >
      Delete the report
    </button>
  );
}

describe('confirmation before important actions', () => {
  const renderConfirm = () => {
    const onConfirm = vi.fn();
    render(
      <Providers>
        <ConfirmProvider>
          <DestructiveAction onConfirm={onConfirm} />
        </ConfirmProvider>
      </Providers>,
    );
    return { onConfirm, invoker: screen.getByRole('button', { name: 'Delete the report' }) };
  };

  it('opens a dialog named and described by its copy, with focus on Cancel', async () => {
    const user = userEvent.setup();
    const { invoker } = renderConfirm();
    await user.click(invoker);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Delete the report?');
    expect(dialog).toHaveAccessibleDescription(/removed/);
    expect(screen.getByRole('button', { name: 'Keep the report' })).toHaveFocus();
  });

  it('cancels with Escape and returns focus to the invoking control', async () => {
    const user = userEvent.setup();
    const { onConfirm, invoker } = renderConfirm();
    await user.click(invoker);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(invoker).toHaveFocus());
  });

  it('calls the action only when confirmed, and returns focus', async () => {
    const user = userEvent.setup();
    const { onConfirm, invoker } = renderConfirm();
    await user.click(invoker);
    await user.click(await screen.findByRole('button', { name: 'Delete the report' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(invoker).toHaveFocus());
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    const { invoker } = renderConfirm();
    await user.click(invoker);
    await screen.findByRole('dialog');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// ── Field wiring without the error-summary machinery ────────────────────────
describe('labelled fields', () => {
  it('wires hint and error through aria-describedby on a custom control', () => {
    render(
      <Providers>
        <Field label="Phone" hint="Include the country code" error="Enter at least 10 digits">
          {(field) => <input {...field.controlProps} />}
        </Field>
      </Providers>,
    );

    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Include the country code/);
    expect(input).toHaveAccessibleDescription(/Enter at least 10 digits/);
  });

  it('exposes the required state natively and in text', () => {
    render(
      <Providers>
        <TextField label="Email" value="" onChange={() => {}} required />
      </Providers>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(screen.getByText(/required/)).toBeInTheDocument();
  });
});

// Keep the import used in the type positions above from looking unused to a linter.
void useA11ySettings;
