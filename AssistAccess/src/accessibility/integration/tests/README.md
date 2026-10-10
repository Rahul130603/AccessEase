# Recommended automated tests

Three test files for the parts that a real test runner can cover, plus the setup they need.
They are written against **Vitest + React Testing Library + axe-core (vitest-axe)**.

## Status: authored, not executed

These files have **not been run**. The review environment has no `node_modules`, no network
access and no test runner, so nothing here is a reported result — they are a recommendation
with complete, runnable code. Everything the review *did* execute is listed in
[../INTEGRATION-REVIEW.md](../INTEGRATION-REVIEW.md).

## Setup

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/dom \
        @testing-library/user-event @testing-library/jest-dom vitest-axe
```

```js
// vitest.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/accessibility/integration/tests/vitest.setup.js'],
    globals: true,
  },
});
```

```bash
npx vitest run                     # everything
npx vitest run src/accessibility   # just this module
```

The existing pure-logic suite needs no runner at all and can stay in CI next to these:

```bash
node src/accessibility/integration/selfTest/settingsSelfTest.mjs
node src/accessibility/integration/selfTest/integrationReview.mjs
node src/accessibility/integration/selfTest/moduleCheck.mjs
```

## What each file covers

| File | Coverage |
|---|---|
| `settings.test.js` | storage adapters incl. the browser-refuses-to-store path, corrupt payloads, scoped reset, one-step undo, clamping, and that a patch cannot reach the flashing allowlist |
| `widget.test.jsx` | launcher name/state, open and close by mouse and keyboard, Escape, focus return, dialog name vs description, all fourteen features present under their category headings, axe on the open panel |
| `forms.test.jsx` | error association (`aria-describedby` + `aria-invalid`), one focus move to the summary with no duplicate live announcement, summary links targeting fields, password toggle (type, `aria-pressed`, value preserved, state announced without the value), dialog focus in/out and Escape, axe on the error form and the dialog |

## What these tests deliberately do not claim

jsdom is not a browser. It does not implement `HTMLDialogElement.showModal()` (the tests use
the component's fallback path; call `mockShowModal()` from the setup file to exercise the
native one), it does not do layout, and it has no accessibility tree. So the following stay
manual — see the checklists in [../INTEGRATION-REVIEW.md](../INTEGRATION-REVIEW.md):

* real screen reader output (names, live regions, dialog modality);
* focus visibility and focus order in a rendering browser;
* autofill, password managers and paste behaviour;
* `forced-colors`, 400% zoom, and reduced-motion behaviour;
* whether the visual filters change the page and not the panel.

axe-core catches roughly a third of accessibility defects by design; a clean axe run is not a
conformance result.

## Suggested CI wiring

```yaml
- run: node src/accessibility/integration/selfTest/moduleCheck.mjs
- run: node src/accessibility/integration/selfTest/integrationReview.mjs
- run: node src/accessibility/integration/selfTest/settingsSelfTest.mjs
- run: npx vitest run
```

`moduleCheck.mjs` and `integrationReview.mjs` exit non-zero on findings, so they work as gates
without any test runner installed.
