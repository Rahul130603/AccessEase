# Accessibility Widgets

This branch includes two independent accessibility widget projects:

- **Visual Accessibility Widget (React + Vite):** the new project is in [`visual-accessibility-widget/`](visual-accessibility-widget/). It includes a live website demo, a standalone embeddable SDK, text sizing, appearance settings, color vision assistance and reading tools. See its [English setup and integration guide](visual-accessibility-widget/README.md).
- **AccessEase:** the existing static demo and Docker setup remain in the repository root. Its instructions are retained below.

To start the Visual Accessibility Widget:

```sh
cd visual-accessibility-widget
npm install
npm run dev
```

---

# AccessEase

A sample learning website with a reusable accessibility widget offering 13 settings. Open `dist/index.html` through a local static HTTP server. The floating button stays in the bottom right corner.

On Windows, double-click `start-server.bat` to serve this demo at `http://localhost:1434/`. Keep the terminal window open while using the website; Ctrl+C stops the server. The launcher locates the website relative to itself and uses Python. If port 1434 is already occupied, it opens the existing local URL instead of starting another server.

## Run with Docker

Start Docker Desktop with the Linux container engine. Stop the Python server first if it is using port 1434. Double-click `start-docker.bat` to build and start the container and open the website. The container keeps running after the batch window closes.

Alternatively, from this repository folder:

```powershell
docker compose up -d --build
```

Open `http://localhost:1434/`. The image serves `dist` with Nginx, and the published port is limited to this computer. Microphone/browser features still run in the user's browser. External video and speech services still require their normal network access. Re-run the command after editing website files to rebuild the image.

```powershell
docker compose logs -f web
docker compose down
```

The first command displays server logs; the second stops and removes this project's container. The Compose project is named `accessease`.

## Integrating the widget

Copy `dist/widget.js` and `dist/accessibility-badge.png` into the same website assets folder and add this before `</body>`:

```html
<script src="/assets/widget.js" defer></script>
```

The widget is framework independent and its interface uses Shadow DOM to avoid inheriting website styles. It modifies paragraphs and controls on the same page, including newly added content. It does not need account, backend or administrator access. Cross-origin iframes and other components' closed shadow roots are outside its reach. Include its script in each page or the shared app layout. Your site's content security policy must allow the script and injected styles.

The accessibility launcher opens one grid containing all 13 settings. Desktop uses three columns; narrower screens use two. Reading speed and text alignment live within the same grid as the toggles. Active toggles have a checkmark, changed dropdowns have an accent border, and the header displays the active count. The panel scrolls when the viewport is too short while keeping its header and Reset controls available.

## Settings

1. Text-to-Speech reads only text highlighted with the cursor in the main region. Enable it, then drag to select a passage; you can also select text before enabling it. A plain click does not start reading. New selections interrupt the previous reading. It stays enabled after playback so another passage can be selected. Browser speech synthesis is required.
2. Adjustable Reading Speed controls the voice from 0.75× to 2×.
3. Text Alignment applies to all host page text, including headings, paragraphs, bold text, links, buttons, labels and inputs. It also adjusts text-bearing flex rows while preserving layout containers. The widget keeps its own control layout. Original removes the alignment overrides and restores the website's styling.
4. Simplified Text Mode covers paragraphs, headings, bold text, navigation, buttons, labels and input placeholders. The host can supply `window.AccessEaseSimpleText` as an original-text to simple-text dictionary (the demo loads `simple-text.js` before the widget). Text nodes are updated in place so formatting and inline icons stay intact. Longer passages can use `<p data-simple="Plain text">Original content</p>`. Turning the mode off restores the original words and markup. Names, numbers and words that are already simple can remain unchanged. It never invents or automatically rewrites website facts.
5. Paragraph Highlighting highlights the hovered paragraph.
6. Keyboard Navigation covers all visible page text and controls, including headings, paragraphs, eyebrow text, labels, captions, lists and tables. Inline text within a paragraph or heading is grouped into one focus stop. Images, SVG artwork, image roles, hidden content and decorative symbols are skipped. Media controls remain keyboard accessible; use their native keys and Tab to move on. Use Tab or Shift+Tab to leave text fields and dropdowns. Turning the mode off restores the original tabindex values.
7. Visible Keyboard Focus adds a stronger outline to the current keyboard focus. When enabled on its own, it also makes all non-image page text reachable with Tab and Shift+Tab. Arrow navigation requires Keyboard Navigation. Text focus stops return to their original tabindex only when both features are off.
8. Skip to Main Content exposes a skip link when focused. Add a semantic `main` or `[role="main"]` to the host website.
9. Large Click Targets applies a minimum 45px target dimension to website links and controls, and to widget buttons and dropdowns. It preserves existing padding so controls that are already larger do not shrink. Turning it off restores the original sizes.
10. Voice Commands uses English browser SpeechRecognition after microphone permission. Wait for “Microphone ready” before speaking. It supports scroll up/down, next/previous, click/select, read selected text, stop reading, open/close settings, reset settings, and stop listening. The legacy “read page” phrase also reads only selected text. Only final recognition results execute commands; unrelated speech produces feedback. Normal session endings and no-speech timeouts reconnect automatically. Permission, microphone and speech service network errors disable voice input with an actionable message. Browser support varies; recognition may use the browser vendor's speech service and require internet access. Voice input starts from user interaction and stops on reload.
11. Switch Device Support supports switches mapped to Space (next) and Enter (activate). Input fields retain normal typing behavior. It provides manual stepping, not timed automatic scanning.
12. Sticky Keys Compatibility supports sequential Ctrl, Alt, A for the widget shortcut, including while a text field is focused. Alt's browser menu behaviour is suppressed during the Ctrl/Alt sequence. Unrelated typing and keyboard shortcuts remain native, and losing window focus cancels a partial sequence. The physical A key is also accepted for keyboard layout compatibility. Operating system Sticky Keys remain a device setting; JavaScript cannot enable them.
13. Closed Captions enables existing video caption/subtitle tracks. It does not generate missing captions. The sample's descriptive captions accompany the nature observation exercise.

Preferences are stored locally in this browser. Microphone input, speech playback and switch stepping are off on reload. Reset restores page text and styling preferences. This widget provides user adjustments; a website still needs accessible source content, semantics and media.

Voice clicks can name a visible control: “click Keyboard Navigation”, “click Start learning”, or “click Close accessibility settings”. Matching uses the button title, link text, or accessible label. Repeated names need an ordinal, such as “click second Explore this course”. A bare “click” activates only the focused interactive control. Missing or ambiguous names produce a message instead of clicking an arbitrary element.

## Voice command checks

Run `node tests/voice-commands.test.cjs` for simulated recognition and command tests. Serve the project root and open `tests/voice-click-check.html` to exercise the actual widget with simulated recognized transcripts. This fixture never uses the microphone. Live speech recognition still requires microphone permission and a supported browser service.

The CC samples are local MP4 files in `dist/media`: a 16-second spoken video, a 10-second silent video with no audio stream, and an 18-second video combining spoken and quiet sections. Each has its own local WebVTT caption track. Nature footage comes from the CC0 flower clip at the MDN interactive examples media host; the spoken passages use synthetic English narration. Once served, these samples do not need an external video connection. `tests/create-caption-samples.ps1` regenerates the MP4 assets using Windows speech synthesis and FFmpeg.
