/**
 * Developer-facing fix examples.
 *
 * These are shown in the audit report next to a finding ("How to fix this") and
 * are the same snippets quoted in the integration guide. They are the honest
 * counterpart of the audit: the toolbar reports, the application fixes its own
 * markup.
 *
 * Copy rules for this file:
 *  - The examples never contain text a toolbar could have written for a specific
 *    image. Descriptions are written by people who know the content, so the
 *    examples use invented sample content inside clearly illustrative markup.
 *  - No backticks anywhere: these strings are template literals.
 */

export const FIX_EXAMPLES = Object.freeze({
  'image-alt-missing': {
    title: 'Give every image a deliberate alternative',
    code: `<!-- Informative image: describe its purpose in context, not its appearance -->
<img src="q4-revenue.png"
     alt="Bar chart: revenue rose from 2.1 million in Q1 to 3.4 million in Q4">

<!-- Decorative image: an empty alt tells assistive technology to skip it.
     alt="" is the semantic way to do this; do not add role="presentation" as
     well, it is redundant and easy to get wrong. -->
<img src="divider-swirl.png" alt="">`,
    notes: [
      'The description is written by whoever knows why the image is on the page. No toolbar can write it.',
      'The presence of an alt attribute proves nothing about its quality — an accurate short sentence and "IMG_2043.jpg" are both "alt text present".',
    ],
  },

  'image-alt-quality': {
    title: 'Replace placeholders that are technically alt text',
    code: `<!-- Avoid: the file name is not a description -->
<img src="IMG_2043.jpg" alt="IMG_2043.jpg">

<!-- Avoid: repeating the caption or the link text beside it -->
<figure>
  <img src="chart.png" alt="Chart">
  <figcaption>Chart: revenue by quarter</figcaption>
</figure>

<!-- Better: purpose first, no "image of", no keyword stuffing -->
<img src="chart.png" alt="Revenue by quarter: Q4 is the highest at 3.4 million">`,
    notes: [
      'Decorative wording such as "image of" or "picture of" adds nothing; screen readers already announce the role.',
      'If the surrounding text already carries the information, the image may be decorative (alt="").',
    ],
  },

  'image-alt-decorative': {
    title: 'Confirm that an empty alt is really decorative',
    code: `<!-- An empty alt is correct for an image that carries no information,
     even a large one. Verify that nothing on the page depends on it. -->
<img src="background-texture.jpg" alt="">

<!-- If the image does carry information, describe it instead: -->
<img src="background-chart.jpg"
     alt="Headcount by team: Engineering 42, Support 18, Sales 9">`,
    notes: [
      'A large image with an empty alt is usually a mistake, but not always — that judgement needs a person.',
    ],
  },

  'image-link-name': {
    title: 'Icon-only controls still need an accessible name',
    code: `<!-- The link is named by the image alt text -->
<a href="/search">
  <img src="search.svg" alt="Search">
</a>

<!-- Or, with an inline SVG, name the link and hide the icon -->
<a href="/search" aria-label="Search">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">...</svg>
</a>

<!-- A visible label is better than both when the design allows it -->
<a href="/search">Search<img src="search.svg" alt="" aria-hidden="true"></a>`,
    notes: [
      'aria-hidden on an <img> that also has alt text is contradictory; use alt="" for decorative images instead.',
    ],
  },

  'form-label-missing': {
    title: 'Label every control with real markup',
    code: `<!-- Visible label, native association: no ARIA needed -->
<label for="email">Email address</label>
<input id="email" type="email" name="email" autocomplete="email"
       aria-describedby="email-hint">
<p id="email-hint">We only use this address to send your receipt.</p>

<!-- If a visible label is genuinely impossible, an invisible name is the fallback -->
<input type="search" aria-label="Search products">

<!-- Never rely on the placeholder: it disappears as soon as the user types -->
<input type="text" placeholder="Full name">   <!-- unlabeled -->`,
    notes: [
      'A placeholder is not a label. It is not a reliable name and it vanishes on input.',
      'The title attribute provides a name, but it is announced inconsistently and is not visible on touch devices.',
    ],
  },

  'form-label-orphan': {
    title: 'A label must point at an id that exists',
    code: `<!-- Broken: the label points at an id nothing has -->
<label for="phone">Phone</label>
<input id="phone-number" type="tel">

<!-- Fixed: ids match -->
<label for="phone-number">Phone</label>
<input id="phone-number" type="tel">`,
    notes: ['This is mechanically checkable, which is why it is reported as a detected problem rather than a review item.'],
  },

  'form-group-label': {
    title: 'Group related controls with fieldset and legend',
    code: `<fieldset>
  <legend>Delivery speed</legend>
  <p id="delivery-hint">Choose one option.</p>

  <label><input type="radio" name="speed" value="standard"> Standard, 3-5 days</label>
  <label><input type="radio" name="speed" value="express"> Express, next day</label>
</fieldset>

<!-- A group of buttons can be named with a real element instead -->
<div role="group" aria-labelledby="filters-heading">
  <h3 id="filters-heading">Filters</h3>
  <button type="button">In stock</button>
  <button type="button">On sale</button>
</div>`,
    notes: [
      'The legend names the group; each option is still named by its own label. Both are needed.',
    ],
  },

  'form-label-mismatch': {
    title: 'Keep the visible label inside the accessible name',
    code: `<!-- Broken: the visible text is "Continue" but the name is "Next step" -->
<button aria-label="Next step">Continue</button>

<!-- Fixed: the accessible name starts with the visible text (WCAG 2.5.3) -->
<button aria-label="Continue to payment">Continue</button>`,
    notes: [
      'Speech-input users say what they see. If the visible text is not part of the name, the command fails.',
    ],
  },

  'headings-missing': {
    title: 'Structure the page with real headings',
    code: `<h1>Account settings</h1>

<section aria-labelledby="billing-heading">
  <h2 id="billing-heading">Billing</h2>
  <h3>Invoices</h3>
</section>

<!-- Do not fake a heading with styling -->
<div class="text-xl font-bold">Billing</div>   <!-- not a heading to assistive tech -->`,
    notes: [
      'Headings are how screen reader users skim a page. Style them with CSS, but keep the elements.',
    ],
  },

  'headings-empty': {
    title: 'An empty heading is a level with nothing in it',
    code: `<!-- Avoid: a heading used for spacing, or holding only an icon -->
<h2></h2>
<h2>&nbsp;</h2>

<!-- Fixed: give the icon a text alternative, or drop the heading -->
<h2><span aria-hidden="true">★</span> Favourites</h2>`,
    notes: [
      'A screen reader announces "heading level 2" and then silence, which sounds like a bug in the page.',
      'If the element is only there to add space, use CSS margins instead.',
    ],
  },

  'headings-skip': {
    title: 'Keep heading levels in order',
    code: `<!-- Avoid: h4 is used to get a smaller font -->
<h2>Account</h2>
<h4>Password</h4>

<!-- Fix: keep the order and change the size with CSS -->
<h2>Account</h2>
<h3 class="text-sm">Password</h3>`,
    notes: [
      'Skipping levels is not a WCAG failure on its own, but it makes the outline harder to follow. The audit reports it as a review item.',
    ],
  },

  'landmarks-main': {
    title: 'One main landmark, plus a skip link',
    code: `<a class="skip-link" href="#main">Skip to main content</a>

<header>
  <nav aria-label="Main">...</nav>
</header>

<main id="main" tabindex="-1">
  ...
</main>

<footer>...</footer>`,
    notes: [
      'One <main> per page. The skip link plus id lets keyboard users bypass repeated navigation (WCAG 2.4.1).',
      'tabindex="-1" makes the target focusable in browsers that do not move focus to a fragment target on their own.',
      'Name multiple landmarks of the same type so they can be told apart: aria-label="Main" and aria-label="Breadcrumb".',
    ],
  },

  'error-association': {
    title: 'Associate the message with the field, and mark the field invalid',
    code: `<!-- The message is real text, referenced by the field, and the field is
     marked invalid. Nothing is signalled by colour alone. -->
<label for="email">Email address</label>
<input id="email" type="email" aria-invalid="true"
       aria-describedby="email-hint email-error">
<p id="email-hint">We only use this to send your receipt.</p>
<p id="email-error"><span>Error: </span>Enter an address in the form name@example.com.</p>

<!-- Without the association, a screen reader user hears "invalid" and nothing else -->
<input id="phone" type="tel" aria-invalid="true">
<p class="error">Phone must have 10 digits</p>   <!-- not connected to anything -->`,
    notes: [
      'aria-describedby is the association that works everywhere; aria-errormessage support is still uneven.',
      'Put the corrective instruction in the message: "Enter an address in the form name@example.com" is actionable, "Invalid input" is not.',
    ],
  },

  'error-summary': {
    title: 'Summarise the problems, and move focus there once',
    code: `function SignUp() {
  const [values, setValues] = useState({ email: '', password: '' });
  const form = useFormErrors();                      // from the accessibility module

  const onSubmit = async (event) => {
    event.preventDefault();
    const problems = validate(values);
    if (Object.keys(problems).length > 0) {
      form.handleFailure(problems);                  // stores them and focuses the summary
      return;
    }
    await save(values);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormErrorSummary form={form} />
      <TextField label="Email" value={values.email} error={form.errors.email} onChange={...} />
      <TextField label="Password" type="password" value={values.password}
                 error={form.errors.password} onChange={...} />
      <button type="submit">Create account</button>
    </form>
  );
}

/* What the summary renders, and why it needs no live region:
   <div class="a11ytb-error-summary" tabindex="-1">
     <h2>There is a problem</h2>
     <ul><li><a href="#email">Enter an email address</a></li></ul>
   </div>
   Focus is moved to the container, which is what makes a screen reader read it.
   Adding role="alert" as well would make the whole summary speak twice. */`,
    notes: [
      'One focus move per failed submission. Do not also announce each field: focusing a field already reads its label, value and message.',
      'Links go to the field id, so the user can go straight to the problem with the keyboard.',
      'Keep the summary in the same order as the fields, and keep the field-level messages identical to the summary entries.',
    ],
  },

  'password-toggle': {
    title: 'A show/hide control that never moves the value',
    code: `<label for="password">Password</label>
<div class="field-with-toggle">
  <input id="password" type="password" autocomplete="current-password"
         aria-describedby="password-hint">
  <button type="button" aria-pressed="false" aria-controls="password"
          aria-label="Show password for Password">Show</button>
</div>
<p id="password-hint">At least 12 characters. Pasting from a password manager is fine.</p>

<!-- The button changes only the type attribute:
     input.type = visible ? 'text' : 'password';
     The value stays in the input. It is never copied to state that is logged,
     never put in an aria-label, and never written to storage. -->`,
    notes: [
      'aria-pressed conveys the state; the visible word changes from Show to Hide; the accessible name says which field it controls.',
      'Keep the button after the input in the DOM so Tab order is field then button, even if CSS positions it inside the field.',
      'Announce the state ("Password shown"), never the value.',
    ],
  },

  'confirm-dialog': {
    title: 'Confirm the actions that cannot be undone',
    code: `const confirm = useConfirm();       // from the accessibility module

const deleteAccount = async () => {
  const ok = await confirm({
    title: 'Delete this account?',
    description: 'The account and all of its reports are removed immediately.',
    details: ['3 reports will be deleted', 'Team members will lose access'],
    confirmLabel: 'Delete account',
    cancelLabel: 'Keep the account',
    destructive: true,
  });
  if (ok) await api.deleteAccount();
};

/* What the component does with that:
   - native <dialog> + showModal(): browser-managed focus trap, inert background,
     top layer, Escape to cancel;
   - aria-labelledby on the title, aria-describedby on the description;
   - initial focus on Cancel because the action is destructive;
   - focus returns to the button that opened it, on confirm and on cancel;
   - no implicit form submission, so Enter cannot fire the destructive action by
     accident.

   Do not confirm routine, reversible actions: a dialog that appears every time
   trains people to dismiss it without reading, which is how the protection is
   lost where it mattered. */`,
    notes: [
      'Put the consequence in the description in plain words, and list what will change when there is more than one effect.',
      'Name the button after the action ("Delete account"), not "OK": the user should be able to answer "what will this do?" from the button alone.',
      'Prefer an undo for reversible actions. A confirmation is the fallback when there is nothing to undo.',
    ],
  },

  'auth-autocomplete': {
    title: 'Give credential fields the right autocomplete value',
    code: `<!-- Sign in -->
<form method="post" action="/session">
  <label for="username">Email address</label>
  <input id="username" name="username" type="email" autocomplete="username"
         autocapitalize="none" spellcheck="false">

  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password">

  <button type="submit">Sign in</button>
  <p><a href="/reset">Forgot your password?</a> &middot;
     <a href="/magic-link">Email me a sign-in link instead</a></p>
</form>

<!-- Registration and password reset use new-password, for both boxes -->
<label for="new-password">Choose a password</label>
<input id="new-password" type="password" autocomplete="new-password">
<label for="repeat-password">Repeat the password</label>
<input id="repeat-password" type="password" autocomplete="new-password">

<!-- One-time code: one field, not six boxes -->
<label for="code">6-digit code</label>
<input id="code" type="text" inputmode="numeric" autocomplete="one-time-code"
       pattern="[0-9]*" maxlength="6" aria-describedby="code-hint">
<p id="code-hint">From your authenticator app. The code expires after 10 minutes.</p>`,
    notes: [
      'These values are what let browsers and password managers fill a field at all, and they are how 1.3.5 Identify Input Purpose is met.',
      'autocomplete="off" on a credential field is the most common way a login becomes unusable with a password manager.',
    ],
  },

  'auth-paste': {
    title: 'Let people paste, and let password managers work',
    code: `<!-- Blocked: paste and the manager both stop working -->
<input type="password" autocomplete="new-password" onpaste="return false">
<input type="text" autocomplete="username" autocomplete="off">

<!-- Allowed: no paste handler, no autocomplete="off" -->
<input type="password" autocomplete="new-password"
       aria-describedby="paste-hint">
<p id="paste-hint">Pasting from a password manager or a text file is allowed.</p>

/* If you think you need to block paste in a "repeat password" field to stop
   typos, compare the values on submit instead. Blocking paste forces people into
   short, memorable, weak passwords, which is what WCAG 3.3.8 exists to prevent. */`,
    notes: [
      'Blocking copy or cut on a code field also breaks the flow for anyone using a password manager to store recovery codes.',
    ],
  },

  'auth-alternatives': {
    title: 'Never make a memory or puzzle test the only way in',
    code: `<!-- Avoid: a puzzle or transcription test as the only path -->
<label for="captcha">Type the third letter of your password</label>
<input id="captcha">
<img src="/puzzle.png" alt="Solve this puzzle to continue">

<!-- Provide a non-cognitive alternative on the same screen -->
<form method="post" action="/session">
  <!-- ...username and password fields... -->
  <button type="submit">Sign in</button>
</form>

<h2>Other ways to sign in</h2>
<ul>
  <li><a href="/magic-link">Email me a sign-in link</a></li>
  <li><a href="/webauthn">Use a passkey or security key</a></li>
  <li><a href="/support">Contact support if you are locked out</a></li>
</ul>

<!-- If a challenge is unavoidable, keep every alternative visible on the page
     next to it, before the user commits to solving it. -->`,
    notes: [
      'WCAG 3.3.8 (AA) requires that no step relies on remembering or transcribing information unless an alternative or an assistive mechanism is available.',
      'A toolbar cannot remove someone else\u2019s puzzle: it can only report it and hand the fix to the team that owns the sign-in screen.',
    ],
  },

  'auth-mfa': {
    title: 'One-time codes and multifactor steps',
    code: `<!-- A single code field, with autofill and a stated lifetime -->
<label for="code">6-digit code</label>
<input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
       pattern="[0-9]*" maxlength="6" aria-describedby="code-hint code-error">
<p id="code-hint">From your authenticator app. It expires 10 minutes after it was sent.</p>
<p id="code-error" role="status">The code was not accepted. Check the digits and try again.</p>

<button type="submit">Verify</button>
<button type="button" onclick="resend()">Send a new code</button>

<!-- Do not auto-submit when six digits are typed: it removes the chance to check
     them, and it breaks screen reader users who review the field before sending. -->

<!-- Offer backup codes, stored where the user can paste them from a manager -->
<label for="backup">Or paste one of your backup codes</label>
<input id="backup" type="text" autocomplete="one-time-code">`,
    notes: [
      'Say how long a code lasts and whether it can be reused; unexplained expiry is a memory burden.',
      'Report the result of "send a new code" through a status message, and never place the code itself in a label, title or log line.',
    ],
  },

  'status-message': {
    title: 'Announce a status once, through one channel',
    code: `// Visible status: the region itself is the announcement.
// role="status" already implies aria-live="polite"; aria-atomic makes the whole
// message read as one unit when it changes.
function SaveStatus({ saved }) {
  return <p role="status" aria-atomic="true">{saved ? 'Draft saved' : ''}</p>;
}

// Nothing visible to show? Announce through the toolbar's shared service instead.
import { useAnnounce } from './accessibility';

function SaveButton() {
  const announce = useAnnounce();
  return (
    <button type="button" onClick={() => { save(); announce('Draft saved'); }}>
      Save draft
    </button>
  );
}`,
    notes: [
      'Pick one channel per message. Doing both makes a screen reader say it twice; the toolbar suppresses exact repeats within 1.5 seconds, but that is a backstop, not a design.',
      'Render the live region before the message. A region that appears with its text already inside is often missed.',
      'role="alert" is assertive and interrupts: reserve it for errors that need attention now, not for confirmations.',
    ],
  },
});

export function getFixExample(id) {
  return (id && FIX_EXAMPLES[id]) || null;
}
