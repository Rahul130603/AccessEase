# AccessEase

An independent sample learning website with the 13 settings assigned to Rahul in the supplied workbook. Open `dist/index.html` through a local static HTTP server. The floating button stays in the bottom right corner.

## Integrating the widget

Copy `dist/widget.js` into your website assets and add this before `</body>`:

```html
<script src="/assets/widget.js" defer></script>
```

The widget is framework independent and its interface uses Shadow DOM to avoid inheriting website styles. It modifies paragraphs and controls on the same page, including newly added content. It does not need account, backend or administrator access. Cross-origin iframes and other components' closed shadow roots are outside its reach. Include its script in each page or the shared app layout. Your site's content security policy must allow the script and injected styles.

## Settings

1. Text-to-Speech reads only selected text or a clicked paragraph/heading in the main region. Enable it, then select a passage or click a paragraph; you can also select text before enabling it. New selections interrupt the previous reading. It stays enabled after playback so another passage can be selected. Browser speech synthesis is required.
2. Adjustable Reading Speed controls the voice from 0.75× to 2×.
3. Text Alignment changes paragraphs, list items and block quotes.
4. Simplified Text Mode uses authored plain-language alternatives: `<p data-simple="Plain text">Original content</p>`. It never invents or automatically rewrites website facts.
5. Paragraph Highlighting highlights the hovered paragraph.
6. Keyboard Navigation adds arrow navigation outside typing fields; native Tab navigation continues to work.
7. Visible Keyboard Focus adds a stronger focus outline.
8. Skip to Main Content exposes a skip link when focused. Add a semantic `main` or `[role="main"]` to the host website.
9. Large Click Targets applies a minimum 45px target dimension and padding to links and controls. Review against the host site's layout.
10. Voice Commands uses browser SpeechRecognition after microphone permission. It supports scroll up/down, next/previous, click/select, read page, stop reading, open/close settings and reset settings. Browser support varies; recognition may use the browser vendor's speech service. Voice and reading start only from user interaction.
11. Switch Device Support supports switches mapped to Space (next) and Enter (activate). Input fields retain normal typing behavior. It provides manual stepping, not timed automatic scanning.
12. Sticky Keys Compatibility supports sequential Ctrl, Alt, A for the widget shortcut. Operating system Sticky Keys remain a device setting; JavaScript cannot enable them.
13. Closed Captions enables existing video caption/subtitle tracks. It does not generate missing captions. The sample's descriptive captions accompany the nature observation exercise.

Preferences are stored locally in this browser. Microphone input, speech playback and switch stepping are off on reload. Reset restores page text and styling preferences. This widget provides user adjustments; a website still needs accessible source content, semantics and media.

The demonstration video is an external CC0 clip from the MDN interactive examples media host. It needs an internet connection. Caption text is supplied locally.
