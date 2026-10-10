# Forms phase — integration & test guide

Four features added on top of the existing module. Nothing in the flashing, visual, audit or
announcement code changed behaviour; the additions are new components, two new audit checks, one new
settings group and four new panels.

| # | Feature | What it delivers |
|---|---|---|
| 1 | Accessible error messages | `useFormErrors` + `FormErrorSummary`, field wiring (`aria-describedby`, `aria-invalid`, corrective text), and an audit check for errors that are not associated with anything |
| 2 | Show / hide password | `PasswordField` with a keyboard-accessible toggle that preserves the value and never exposes it |
| 3 | Accessible authentication | Sign-in / registration / reset / one-time-code examples with correct `autocomplete`, paste allowed; an audit of this page's credential fields; explicit privacy and boundary statements |
| 4 | Confirmation before important actions | `ConfirmProvider` + `useConfirm()` + `ConfirmButton` + `ReviewAndConfirm`, built on native `<dialog>` |

Three rules from the earlier phases still govern everything here:

* **Report, do not repair.** The two new audit checks read attributes only. They never set
  `aria-invalid`, never add `aria-describedby`, never strip a paste handler, never fill a credential.
* **One channel per message.** Error summaries are focused, not also announced; dialogs are read by
  virtue of their own name and description, not also announced.
* **No secrets, ever.** Nothing in the module writes a password, code, token or field value to
  preferences, storage, labels, logs or announcements.

---

## 1. New files

```
src/accessibility/
  patterns/
    FormErrorSummary.jsx     FormErrorSummary + useFormErrors (state, summary focus, field focus)
    PasswordField.jsx        password input + accessible show/hide control
    AuthForms.jsx            SignInForm, RegistrationForm, PasswordResetForm, OneTimeCodeStep
    ReviewAndConfirm.jsx     review step for 3.3.4 submissions (definition list + confirm)
  ui/
    ConfirmDialog.jsx        native <dialog> + showModal, Escape/backdrop cancel, focus return,
                             accessible fallback (aria-modal + manual focus cycle) without showModal
    ConfirmButton.jsx        button that confirms before running its action
  core/
    confirm/ConfirmContext.jsx  ConfirmProvider + useConfirm() (promise API, queue, fails closed)
    audit/checks/checkFormErrors.js   errors not associated with their field
    audit/checks/checkAuthFields.js   autocomplete, paste blockers, cognitive-test signals

src/accessibility/INTEGRATION-FORMS.md   this file
src/accessibility/integration/devHarness/FormsFixtures.jsx   manual-test fixtures
```

Modified (additive): `constants.js` (feature ids, `AUTH` group, `CONFIRM_PATTERN` style id),
`settingsSchema.js` (`forms` group + `FORM_BOOLEAN_KEYS`), `settingsReducer.js` (`SET_FORMS`),
`SettingsContext.jsx` (`actions.setForms`), `strings.js` (four copy groups + announcement templates),
`patterns/appStyles.js` (error summary, password, auth, review, dialog styles),
`patterns/FormField.jsx` (`announceErrors` now defaults to the user's setting), `audit/checks/index.js`,
`features/registry.js` (four descriptors), `AccessibilityModule.jsx` (`ConfirmProvider`),
`index.js` (new exports).

---

## 2. Integration examples

### 2.1 Error messages

```jsx
import { FormErrorSummary, TextField, useFormErrors } from './accessibility';

function SignUp() {
  const formRef = useRef(null);
  const form = useFormErrors({ formRef });          // pass formRef to also resolve by name
  const [values, setValues] = useState({ email: '', password: '' });

  const onSubmit = async (event) => {
    event.preventDefault();
    const problems = validate(values);              // { email: 'Enter an email address…' }
    if (Object.keys(problems).length > 0) {
      form.handleFailure(problems);                 // stores them + focuses the summary, once
      return;
    }
    await save(values);
  };

  return (
    <form onSubmit={onSubmit} ref={formRef} noValidate>
      <FormErrorSummary form={form} />
      <TextField id="email" label="Email address" value={values.email}
                 error={form.errors.email}
                 onChange={(next) => { setValues((v) => ({ ...v, email: next })); form.clear('email'); }} />
      <button type="submit">Create account</button>
    </form>
  );
}
```

Error keys are field ids (or names): the summary links to `#id`, and `focusField(key)` resolves by id
first, then through the native form association (`form.elements.namedItem`).

What the components do, in order of the requirement list:

| Requirement | How |
|---|---|
| Associate errors with inputs | The message element's id goes into the field's `aria-describedby` (hint and error together) |
| `aria-invalid` when invalid | Set from the `error` prop, cleared when the message clears |
| Corrective messages, not colour only | Real text with a visible `Error: ` prefix, a dashed 2px border as a second signal, and wording that says what to do |
| Form-level summary + focus management | `FormErrorSummary` is focusable (`tabindex="-1"`), `handleFailure` focuses it once; each entry links to its field |
| No excessive or duplicate announcements | The summary is focused rather than announced; `forms.announceErrors` (off by default) is the only way to add an announcement, and the shared service deduplicates it |

### 2.2 Show / hide password

```jsx
import { PasswordField } from './accessibility';

<PasswordField
  id="password"
  label="Password"
  autoComplete="current-password"        // "new-password" for registration or reset
  value={password}
  onChange={setPassword}
  error={form.errors.password}
  hint="At least 12 characters. Pasting from a password manager is fine."
/>
```

* The toggle is a `<button type="button">` **after** the input in the DOM (Tab order: field → button)
  although CSS positions it inside the field.
* `aria-pressed` carries the state; the accessible name is “Show password for Password” (the visible
  word is part of the name, WCAG 2.5.3); `aria-controls` points at the input.
* Only the `type` attribute changes, so the value, the autofill state and the form association are
  untouched. Caret position is restored after the switch.
* The announcement is “Password shown” / “Password hidden”. The value is never announced, copied,
  logged or stored.
* `forms.passwordToggle` (panel → “Show and hide password”) turns the control off for users who do
  not want it.

### 2.3 Accessible authentication

```jsx
import { SignInForm, RegistrationForm, PasswordResetForm, OneTimeCodeStep } from './accessibility';

<SignInForm values={credentials} onChange={setCredentials} onSubmit={signIn}
            errors={form.errors} form={form}
            onForgotPassword={() => setStep('reset')}
            onEmailLink={() => sendMagicLink(credentials.email)} />
```

| Step | autocomplete | Notes |
|---|---|---|
| Sign-in identifier | `username` | `type="email"`, `autoCapitalize="none"`, `spellCheck={false}` |
| Sign-in password | `current-password` | Never `off`, never paste-blocked |
| Registration password and its repeat | `new-password` on both | Pasting into the repeat box is essential, and common to block by mistake |
| Reset identifier | `username` | The reset link form keeps the identifier’s purpose |
| One-time code | `one-time-code` | One field, `inputMode="numeric"`, `pattern="[0-9]*"`, `maxLength={6}`, no auto-submit |
| Backup code | `one-time-code` | So a manager can paste it |

Beyond autocomplete, the examples include what 3.3.8 and 3.3.7 ask for: a visible non-cognitive
alternative on the sign-in screen (emailed link, support route), a stated code lifetime, a resend
control whose result is reported, guidance for multifactor steps, and no memory or puzzle test as the
only path in.

### 2.4 Confirmation before important actions

```jsx
import { useConfirm, ConfirmButton, ReviewAndConfirm } from './accessibility';

const confirm = useConfirm();

const ok = await confirm({
  title: 'Delete this account?',
  description: 'The account and all of its reports are removed immediately.',
  details: ['3 reports will be deleted', 'Team members will lose access'],
  confirmLabel: 'Delete account',
  cancelLabel: 'Keep the account',
  destructive: true,          // focus starts on Cancel
});
```

```jsx
<ConfirmButton confirm={{ title: 'Remove this member?', destructive: true, confirmLabel: 'Remove' }}
               onConfirm={removeMember}>
  Remove
</ConfirmButton>

<ReviewAndConfirm
  title="Review your transfer"
  items={[{ label: 'Amount', value: '1,250.00 GBP' }]}
  onEdit={() => setStep('details')}
  confirmLabel="Send 1,250.00 GBP"
  onConfirm={submitTransfer}
/>
```

| Requirement | How it is met |
|---|---|
| Reusable dialog | `ConfirmProvider` mounts one dialog for the app tree and for the toolbar's own panels; requests queue instead of replacing each other |
| Keyboard, Escape, visible focus | Native `showModal()` provides the focus trap, inert background and Escape → `cancel` event; the fallback path (`aria-modal="true"`) implements the Tab cycle and Escape itself; a 3px `:focus-visible` ring that is never suppressed |
| Accessible title and description | `aria-labelledby` on the title, `aria-describedby` on the description, plus an optional details list |
| Focus returns to the invoking control | The element that had focus when the dialog opened is remembered and re-focused after close — on confirm and on cancel |
| Native dialog behaviour preferred | `<dialog>` + `showModal()` first; the hand-rolled pattern only when `showModal` is missing |
| No confirmation for routine actions | The dialog is opt-in per action, and the panel lists when it is worth it and when it is not (routine or undoable actions should not confirm) |
| No accidental confirmation | Screens are not forms, so there is no implicit submission; Enter activates the focused button only |

`useConfirm()` **fails closed** without a provider: it falls back to `window.confirm`, and returns
`false` if even that is unavailable. A missing dialog never becomes permission.

---

## 3. Privacy: what is stored, and how to verify it

* One storage key: `assistaccess.a11y.settings`. It contains the settings groups only
  (`visual`, `motion`, `reader`, `forms`, `ui`, `meta`). `forms` holds two booleans.
* No component in `patterns/` writes to `localStorage`, `sessionStorage`, cookies or IndexedDB, and
  none of them reads `input.value` for a credential field except to pass it to the caller's
  `onChange`.
* The audit checks read attributes (`type`, `autocomplete`, `name`, `id`, inline handler attributes).
  They never read `input.value`.
* Exported settings (feature 12, later phase) will contain the same preferences and nothing else.

Verification steps (manual, in the harness):

1. Type a password in the “Error summary and field errors” form, then run
   `JSON.stringify(localStorage).includes(document.getElementById('demo-password').value)` — it must
   return `false`.
2. Type a password in the “Show and hide password” fixture, toggle twice, then check the same way.
3. Search the module for storage access:
   `rg -n "localStorage|sessionStorage|indexedDB|document.cookie" src/accessibility` — the only hits
   must be `core/storage.js` and the harness.
4. Export/import is a later phase; when it lands, the same check applies to the exported file.

---

## 4. Keyboard test cases

**Error messages**

1. In “Error summary and field errors”, press Enter on “Create the demo account” with everything
   empty. [Focus lands on the summary; it is read once; no second announcement]
2. `Tab` to the first summary link and press Enter. [Focus moves to the email field, which announces
   its label, its hint and its `Error: …` message; no new history entry is added]
3. Type a valid email, then submit again. [The email error disappears from both the field and the
   summary; the summary keeps the remaining items]
4. Correct everything and submit. [No summary is rendered; the status line confirms]
5. Turn on “Also announce errors out loud” in the panel, submit an invalid form, and compare.
   [The summary is now also announced — deliberately two utterances, which is why it is off]

**Show / hide password**

6. `Tab` into the demo password field, type `correct horse battery staple`, then `Tab` to Show.
   [Focus order is field → button; the button's name includes the field it controls]
7. Press Space. [The text becomes readable, `aria-pressed` becomes true, the visible label changes to
   Hide, the announcement says “Password shown”, the caret stays where it was]
8. Press Space again. [Back to hidden; the value is unchanged]
9. Check the aria-label of the button while shown and hidden. [It never contains the value]

**Authentication**

10. `Tab` through the sign-in example. [Email announces its label and autocomplete purpose; the
    password field announces label and hint; the two alternative buttons follow the submit button]
11. Paste into the password field. [Paste works — nothing blocks it]
12. `Tab` into the one-time-code field. [It announces the label and the “From your authenticator app…”
    hint; typing six digits does **not** submit]
13. Press “Send a new code”. [A status message reports the result once]

**Confirmation**

14. Focus “Delete the quarterly report” and press Enter. [The dialog opens; focus is on “Keep the
    report” because the action is destructive]
15. Press Escape. [The dialog closes and focus returns to the button]
16. Open it again, press Tab twice. [Focus cycles between the two buttons; it cannot leave the dialog]
17. Open it again and press Enter on “Delete the report”. [The demo reports deletion, focus returns to
    the button, and the button is disabled afterwards]
18. Open it again and click the backdrop. [The dialog cancels and focus returns]
19. In the review step, `Tab` through the definition list and confirm buttons. [`Change these details`
    returns to the previous step without losing the values]

---

## 5. Screen-reader test cases

Test with NVDA + Firefox and VoiceOver + Safari.

1. **Field error.** Focus the invalid email field. [Label, hint and error are read together; the
   invalid state is announced; the message is not repeated a second time]
2. **Summary.** After a failed submit, focus is on the summary. [“There is a problem”, then the list
   of problems, each announced as a link]
3. **No duplicate.** Listen for the whole submit interaction. [The summary is spoken once — the
   failure mode this design avoids is hearing it twice]
4. **Password toggle.** Navigate to the Show button. [“Show password for Password, toggle button, not
   pressed”; after activation “pressed” and “Password shown”]
5. **No value leaks.** Read the toggle button, the field and the surrounding text while the password
   is visible. [The value is never announced by the toggle or by any status message]
6. **One-time code.** Read the code field. [“Six-digit code, edit, required”, the hint follows as a
   description, and the field reports `one-time-code` autofill where supported]
7. **Alternatives.** Read the sign-in form top to bottom. [The emailed-link and support alternatives
   are reachable and named, not hidden behind an icon]
8. **Confirm dialog.** Activate the destructive button. [The dialog announces its name and
   description; “Keep the report” has focus; the dialog is modal — browse mode cannot reach the page
   behind it]
9. **Focus return.** Cancel with Escape. [Focus is back on the button that opened the dialog, and the
   screen reader announces it again]
10. **Queueing.** Trigger two confirmations in quick succession (two harness buttons). [The second
    waits; neither replaces the other]
11. **Audit findings.** Open “Accessible authentication” and read the findings for the deliberate
    defects. [Each names the field, the evidence (`autocomplete="off"`, `onpaste`) and links to a fix
    example; none of them claims to have changed anything]

---

## 6. What a toolbar still cannot do

* **Repair another site's authentication.** The audit reports missing `autocomplete`, `autocomplete="off"`,
  inline paste blockers and signals of a memory test. It cannot remove a captcha, restructure a login,
  or make a third-party identity provider conform to 3.3.8. The fix belongs to the team that owns the
  sign-in screen, and the panel says so.
* **Add a show/hide control to a password field it did not create.** Injecting a button into someone
  else's form can break their layout, their validation and their tests, and revealing a credential is
  a decision for the form that owns it.
* **Judge the quality of an error message.** The audit can prove that a message is associated and
  reads as corrective text; whether it actually helps is a human judgement, and those findings are
  labelled as review items.
* **Replace manual testing.** These components remove a class of failure at the source; they do not
  make an application conform to WCAG, and no toolbar can.

---

## 7. Verification performed

* `node --check` on every plain-JS module, and a static pass over all `.js`/`.jsx` files: relative
  imports resolve, no `.css` import outside the harness, balanced braces and JSX tags, no duplicate
  exports.
* `!important` still confined to `core/apply/forcedStyles.js` (justified per stylesheet) and the
  toolbar's own shadow-scoped motion rules; the new component stylesheets contain none.
* **Not verified:** runtime behaviour. Focus behaviour, `<dialog>` modality, autofill and screen
  reader output require a real browser and a real screen reader — run sections 4 and 5 before merging.
