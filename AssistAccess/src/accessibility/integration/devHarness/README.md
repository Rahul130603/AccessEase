# Dev harness

A deliberately hostile host application used to test the accessibility toolbar by hand.
It is not part of the shipped module — delete the folder when you are done with it.

It simulates a real team project:

* aggressive global CSS (`*`, element selectors, a `[hidden] { display: block }` override),
* a sticky header and a `position: fixed` banner inside the app tree,
* a teammate-style button that writes an **inline filter on `<html>`** (to prove the toolbar
  composes with it instead of overwriting it),
* animation fixtures with known flash rates: 150 ms (≈6.7/s), 120 ms opacity (≈8.3/s), 800 ms
  (≈1.3/s, must not be flagged), a spinner (no luminance change, must not be flagged),
* an excluded zone (`data-a11ytb-exclude`),
* a canvas animation (~5/s) that CSS-based detection genuinely cannot see,
* video / animated-image / marquee fixtures, and
* a correct implementation of the `SafeAnimatedContent` pattern.

## Running it

Any bundler works; Vite is quickest.

```bash
npm create vite@latest a11y-harness -- --template react
cd a11y-harness
npm install
# copy src/accessibility into src/accessibility, then point the entry at the harness:
#   index.html:  <script type="module" src="/src/accessibility/integration/devHarness/main.jsx"></script>
npm run dev
```

Optional: drop a `sample.mp4` and a `flash.gif` next to the harness `index.html` to test the media
controls on real files.

The manual test steps are in [`../INTEGRATION.md`](../INTEGRATION.md), section 5.
