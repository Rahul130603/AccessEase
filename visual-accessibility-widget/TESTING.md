# Delivery verification — 9 October 2026

Verified on Windows with Node.js 24.18.0 and npm 11.16.0.

| Check | Result |
|---|---|
| npm test | 7/7 unit tests passed |
| SDK and React production builds | Passed; one integrated React demo and standalone SDK |
| Final targeted browser tests | 18/18 passed across Chromium, Firefox and WebKit in 2.3 minutes |
| Accessibility audits | All five palettes at 1280px, 390px and 320px, page/drawer, overlays and combined themes had zero WCAG-tagged axe violations |
| Production smoke | Passed: five dropdown modes, persistence, reset, standalone SDK, text bounds and switch-only themes; no browser exceptions |
| Removed page | Source and production HTML removed; production request to /color-blindness.html returns 404 |
| Visual captures | All five integrated palettes and compact desktop/mobile dropdown panel |

The standalone SDK is 634,894 bytes, approximately 458.43 KB gzip (including all four bundled font variants). It has no React runtime dependency.

## Current update

Color Blindness Support uses one native select with exactly five options: Normal / Default, Protanopia Support, Deuteranopia Support, Tritanopia Support and High Distinction / Monochrome. Tests select every option, verify actual button and chart colors, refresh to check persistence, reset to original colors and exercise keyboard selection. Color-only reset preserves text-size preferences. Tests also assert that no radio cards or separate-page link remain.

The main sample opens the integrated widget, scrolls its body to the color card and focuses the dropdown. The header and footer remain stable. The shared React component also uses a native dropdown and centralized palette configuration.

CSS custom properties update backgrounds, buttons, features, statuses and chart categories. Status icons, labels, border styles and chart patterns remain available in every mode. A caption contrast issue found during this update was fixed by applying each palette's readable muted-text token; the final browser audits passed after that change.

The widget retains its other settings, including 100% default text size, 50%–200% bounds in 10-point steps, minus/percentage/plus controls, switch-only themes and complete reset. The latest targeted run covers palette flows, persistence, keyboard use, accessibility audits and 200% reflow; the full regression suite was not rerun for this dropdown update.

## Reproduce verification

```powershell
npm install
npm test
npm run build
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright-browsers"
npx playwright install chromium --no-shell
npx playwright install firefox webkit
npm run test:e2e -- --workers=2 --grep 'dropdown|color assistance|axe audit|reflow'
node scripts/smoke-production.mjs
```

Run npm run dev before the optional screenshot scripts. Browser binaries and node_modules are excluded from the source archive. The local environment required approved execution outside the Windows sandbox for Node commands; this is not an application requirement.

## Practical limits

Automated and visual checks are not a formal WCAG certification. Real screen readers were not manually exercised. Assistance palettes are not medically accurate simulations. Host integration and iframe/canvas/PDF limitations are documented in README.md.

Latest UI cleanup: removed the theme status/default row and the trailing color assistance note. Rebuilt React and SDK bundles; six theme/color flow checks passed across Chromium, Firefox and WebKit (52.1 seconds). Desktop/mobile screenshots refreshed.



Cursor magnifier update: popup now follows hovered text beside the pointer, anchors to keyboard focus and adjusts at viewport edges. React/SDK production builds passed. Six magnifier flow/edge tests passed across Chromium, Firefox and WebKit (20.1 seconds), including 1280px, 390px and 320px widths. Desktop/mobile magnifier screenshots visually reviewed.


Content-only magnifier update: removed header/instructions and close control. Rendered text detection now supports generic HTML elements, multilingual text, numbers, editable content and visible form values, with image/alternative-text and password exclusions. Escape and the widget toggle dismiss the popup. Nine final magnifier tests passed across Chromium, Firefox and WebKit (30.8 seconds); React/SDK builds passed and desktop/mobile previews refreshed. Native apps and inaccessible cross-origin frames require integration; no OCR is performed.


Settings description cleanup: removed descriptive subtitles and explanatory notes from every settings card and the reusable color tool. Names, icons, controls, selected-mode status and behavior remain intact. React/SDK builds passed; nine existing theme/color/magnifier flow checks passed across Chromium, Firefox and WebKit (46.5 seconds). Desktop/mobile panel screenshots refreshed.


Custom spacing fix: selecting Custom restores authored spacing with no active spacing overrides. Each adjusted slider applies only its dimension; explicit adjustments persist, including a line-height value equal to the slider initial value. Reset All Settings restores original letter/word/line/paragraph spacing. Unit tests: 7/7 passed. React and SDK builds passed. Final targeted browser checks cover custom defaults, four slider adjustments, API compatibility, reload persistence and combined-preference reset across three browsers.


Four-dimension spacing review: corrected line-height display from px to × and added Original/Adjusted live preview. Browser assertions verified computed letter spacing, word spacing, line height and paragraph margin on actual website text, matching preview values, unchanged Original sample, default restoration, refresh persistence and reset. Seven unit tests and production builds passed. Nine targeted spacing/persistence/accessibility tests passed across Chromium, Firefox and WebKit (43.5 seconds). Desktop/mobile comparison screenshots captured; adjusted preview opened in Codex's right panel.


Link/button highlighting update: all scoped native links/buttons, submit/reset/button/image inputs, semantic role buttons/links and disclosure summaries receive visible outlines; links also receive underlines. Dynamic controls inherit highlighting. Keyboard focus uses a distinct dashed outline. Dark/contrast themes use yellow outlines. Nine existing link/font and accessibility checks passed across three browsers. Three final semantic-control tests passed (12.4 seconds), checking native/disabled/custom/dynamic controls, click behavior, real Tab focus and original-style restoration. An initial programmatic-focus assertion was corrected to exercise keyboard focus. React/SDK builds passed and desktop/mobile previews reviewed.


OpenDyslexic update: replaced Verdana/Arial override with genuine bundled Regular/Bold/Italic/BoldItalic WOFF2 fonts from the official project, pinned source and SIL OFL license included. Seven unit tests and React/SDK builds passed. Nine font/persistence/integration browser checks passed (35.8 seconds); three additional final standalone checks passed (10.1 seconds) after adding explicit real-font loading/restoration assertions. Tests verify all four FontFace variants actually load, authored fonts restore, preferences persist and standalone font loading works in Chromium, Firefox and WebKit. Desktop/mobile typography screenshots reviewed and desktop preview opened in the right panel.


10 October 2026 — screen-edge reading controls: added independent left minus/right plus buttons for guide thickness (2–24px, 2px steps) and mask band size (60–240px, 10px steps). Controls stay on-screen and synchronize with saved preferences and drawer sliders. Verified keyboard activation, mobile 390px/320px bounds, limits, persistence and reset. Corrected an existing reading-guide focus anchor to the focused line centre while preserving magnifier positioning. React/SDK builds passed. Initial tests exposed that focus-anchor error and Firefox contention timeouts; final verification was run sequentially. Three accessibility audits passed across browser engines. Desktop/mobile previews visually reviewed.

Final reading controls/guide/magnifier verification: 9/9 passed across Chromium, Firefox and WebKit (59.0 seconds).

Reading controls label cleanup: removed visible Guide/Mask text; minus/plus icons, accessible labels, tooltips and behavior retained. Production builds passed and desktop/mobile captures refreshed.


10 October 2026 — full-screen reading mask: removed the fixed 240px maximum. Slider and screen-edge plus controls now reach the viewport height, with a persistent full-screen state that adapts to resizing. Mask centre is clamped so the full-height clear band covers the whole viewport regardless of pointer position. Minus shrinks it again; reset returns to 120px. Seven unit tests and production builds passed.

Final full-screen mask/control/guide tests: 9/9 passed across Chromium, Firefox and WebKit (1.4 minutes), including desktop 1280x900 and mobile 390x844/320x640, resize/reload, slider End, screen-edge plus/minus, disabled limits, keyboard, reset and guide regression. Desktop/mobile full-screen previews captured and reviewed.

Reading Mask maximum revised to 540px as requested. Slider, +/- controls, API normalization and persisted sizes now cap at 540px; old full-screen preferences migrate to 540px. Minimum 60px and 10px steps retained. Seven unit tests, builds and six mask/control browser checks passed across three engines (30.0 seconds). 540px desktop/mobile previews refreshed.


Script error investigation: screenshot showed an unsaved editor buffer missing the opening license-comment marker; on-disk bundle initially parsed correctly. Changed font license header to preserved legal line comments (//!), added build-time JavaScript parsing and font-license retention checks, regenerated public/dist bundles, and passed node --check for both. Final production smoke passed with no browser exceptions. Localhost server was stopped and restarted.


## Adaptive Light Mode - 10 October 2026

Production React and SDK builds passed. Nine targeted checks passed across Chromium, Firefox and WebKit: adaptive light surface/photo/chart preservation and dark surface conversion, exclusive theme switching, and combined-theme accessibility audits. The adaptive test also checks dynamically inserted dark sections and original style restoration when switched off. Transparent chart containers retain their original effective backdrop when their dark parent becomes light. Desktop before/after captures are in artifacts/light-mode-original-desktop.png and artifacts/light-mode-preserved-desktop.png.

## News integration typography - 10 October 2026

Reproduced transition:all font compounding on AccessPulse (navigation text reached 128px after repeated changes). Fixed baseline restoration and proportional line height, and added reversible layout reflow. Final builds passed. Six transition/reflow tests passed across Chromium, Firefox and WebKit, including 320px width and 200% plus wide spacing. The actual news website passed Chromium checks at 1366px and 390px, 150% and 200% plus OpenDyslexic, repeated refresh stability, document width, reset, original link and no JavaScript exceptions. Text bounds and dyslexia switching also passed in all three browsers. The complete test suite was not rerun. Preview captures: artifacts/news-typography-1366.png and artifacts/news-typography-390.png.

A final mobile visual check caught nested logo containers squeezing the wordmark into single-character columns; reflow now assigns the small-screen branding group its own full-width row. The news integration checks were rerun and passed after that correction, and desktop/mobile previews were inspected.
