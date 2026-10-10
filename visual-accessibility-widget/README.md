# Visual Accessibility Widget

A React and Vite demo website with a reusable, framework-independent accessibility widget. The widget runs in an isolated Shadow DOM, applies preferences to supported website content and stores settings locally in the browser. No backend or account is required.

## Requirements

- Node.js 22.12 or later; Node.js 24 is recommended.
- npm.

## Run locally

```sh
cd visual-accessibility-widget
npm install
npm run dev
```

Open the URL printed by Vite. The development command automatically builds the standalone widget. Use the floating accessibility button to open its settings.

If you are already inside this project's folder, omit the first command.

## Build for production

```sh
npm run build
npm run preview
```

The build creates the demo website and `dist/accessibility-widget.js`. The standalone script includes its styles, icons and OpenDyslexic fonts; it does not require React on the client website.

## Add the widget to another website

1. Run `npm run build`.
2. Copy `dist/accessibility-widget.js` to your website's public/static directory.
3. Add this script before the closing `</body>` tag:

```html
<script src="/accessibility-widget.js" defer></script>
```

For a React/Vite client website, place the bundle in `public/` and add the script to `index.html`. Keep the client's existing application script. The client does not need a separate widget development server when it hosts this file itself.

To limit adjustments to the main content, use an existing selector:

```html
<script
  src="/accessibility-widget.js"
  data-content-root="main"
  data-primary-color="#2563EB"
  defer
></script>
```

The script automatically initializes once. Include it in the shared layout for sites with multiple pages.

## Accessibility settings

1. Increase text size.
2. Decrease text size.
3. High Contrast Mode.
4. Dark Mode.
5. Light Mode.
6. Grayscale Mode.
7. Color Blindness Support.
8. Text Spacing Adjustment.
9. Highlight Links and Buttons.
10. Dyslexia-Friendly Font.
11. Reading Mask.
12. Reading Guide.
13. Text Magnifier.

Text size starts at 100% and changes in 10-percentage-point steps from 50% to 200%. Increase and decrease share one card. Custom spacing controls letter spacing, word spacing, line height and paragraph spacing. OpenDyslexic includes regular, bold, italic and bold italic variants.

Color assistance offers Normal / Default, Protanopia Support, Deuteranopia Support, Tritanopia Support and High Distinction / Monochrome. These are assistance palettes, not medical simulations. Status labels, icons, borders and patterns supplement colors.

Light Mode retains existing light surfaces while converting supported dark surfaces to a light background with dark text. Recognized charts and photos retain their appearance. Theme toggles are exclusive. Reset restores the website's authored styles and preferences.

Font-size measurement avoids compounding sizes on websites with animated CSS transitions. Reflow supports ordinary flexible rows, crowded grids and text overlays. Preferences reapply to dynamically inserted content.

## JavaScript API

After the script loads:

```js
const widget = window.AccessibilityWidget.getInstance();
widget.open();
widget.close();
widget.setSettings({ fontScale: 1.2, dyslexiaFont: true });
widget.getSettings();
widget.reset();
widget.refresh();
```

For manual initialization, add `data-auto-init="false"` to the script and call `window.AccessibilityWidget.init({ root: 'main' })` after it loads. `window.AccessibilityWidget.destroy()` removes the widget and restores managed styles.

## Integration boundaries

- Use `data-uaw-ignore` to exclude a content subtree from adjustments.
- Use `data-uaw-icon` to preserve icon-font glyphs.
- Use `data-uaw-preserve-layout` to exclude specialized layouts from automatic reflow.
- Use `data-uaw-preserve-colors` or `data-uaw-chart` for custom visualizations whose colors must remain unchanged in Light Mode.
- Test large text and dyslexia mode against your site's layout. Fixed positioning and custom clipping may need site-specific responsive CSS.
- Cross-origin iframes, closed shadow roots, canvas text and native application screens are outside the widget's DOM access. The magnifier reads supported rendered text, not text inside images.
- A content security policy must permit the widget script and injected styles/fonts. The API supports a stylesheet nonce; strict inline-style restrictions require a site-specific integration.
- The widget offers user preferences and does not automatically make a website WCAG-compliant.

## Tests

```sh
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
```

For a production smoke check:

```sh
npm run build
node scripts/smoke-production.mjs
```

See `TESTING.md` for verification details and the scope of checks already performed.

## Project structure

- `src/`: React demo, shared preference engine, color modes and fonts.
- `sdk/`: standalone widget, controls, icons and bootstrap.
- `public/`: demo images, integration example and font license.
- `tests/`: unit and browser checks.
- `scripts/smoke-production.mjs`: production integration check.
- `vite.config.js` and `vite.sdk.config.js`: demo and SDK builds.

Generated builds, dependencies, screenshots, archives, local browser downloads and client-specific diagnostic scripts are excluded from Git. Run the build to produce the distributable widget.

## Font license

Bundled OpenDyslexic fonts are distributed under the SIL Open Font License 1.1. The source attribution and license are included in `src/assets/fonts/opendyslexic/` and `public/OpenDyslexic-OFL.txt`. The standalone bundle retains the license notice.
