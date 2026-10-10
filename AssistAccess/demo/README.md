# Demo site

A small marketing page used to exercise the accessibility widget by hand. It has real
content — sticky header, cards with images, a data table, two forms, a footer — plus four
deliberate faults so the page check has something to report:

1. the third service card has an image with **no `alt` attribute**,
2. the second card uses its **file name as alt text**,
3. the newsletter form has a **placeholder-only input** with no label,
4. the promo banner **flashes about 6.7 times per second** (for flashing protection).

Each one is labelled in the page itself, so a tester knows what is intentional.

## Quick start (this repository)

The repository root is a Vite app, so there is nothing to scaffold:

```bash
npm install       # react, react-dom, vite, @vitejs/plugin-react
npm run dev       # prints a URL and opens http://localhost:5173/demo/
```

Two pages are served from the same dev server:

| URL | What it is |
|---|---|
| `http://localhost:5173/demo/` | This demo site: real content plus the four deliberate faults below |
| `http://localhost:5173/src/accessibility/integration/devHarness/` | The hostile host app: aggressive global CSS, fixed and sticky elements, animation fixtures, excluded zones, media stubs |

Other scripts:

```bash
npm run build        # compiles BOTH pages through the whole module graph (a real syntax/import check)
npm run preview      # serves the production build on http://localhost:4173
npm run check        # the three Node gates: module integrity, integration review, settings self-test
npm run sync:styles  # regenerates the shadow-root copy of accessibility.css after editing it
```

Stop the dev server with `Ctrl+C` in the terminal running it. If port 5173 is taken, Vite
prints the port it actually used — read the URL rather than assuming.

## Into an existing React app

If you are integrating into a project that already has its own build, copy the module and
wrap the app:

```jsx
import AccessibilityModule from './accessibility/index.js';   // the public entry point

<AccessibilityModule config={{ position: { corner: 'right-middle' } }}>
  <App />
</AccessibilityModule>
```

The module needs React 18 or later and nothing else — no CSS imports, no other packages.

Optional demo assets are already included (`card-research.svg`, `card-design.svg`,
`card-build.svg`); the broken-image look is not needed for the audit to work, but the SVGs
make the page look finished.

## What to test here

The full checklist for all fourteen features is in
[`../src/accessibility/TESTING.md`](../src/accessibility/TESTING.md). The short version:

* open and close the widget with the mouse, with Enter/Space on the launcher, with Escape,
  and by clicking the page;
* the promo banner should stop flashing within a couple of seconds (flashing protection);
* the display sliders should visibly change the page but **not** the widget itself;
* “Page check” should report the missing alt text, the file-name alt and the unlabelled
  input, and should offer to show you where each one is;
* the password field's Show/Hide button, the confirmation dialog on “Delete account”, and
  the profile chips should all behave as described;
* reload the page: every choice is still there.
