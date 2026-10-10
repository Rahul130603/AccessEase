# 🌐 Universal Standalone Accessibility Widget (Sudhin)
## Full WCAG 2.1 & 2.2 AA Compliant • Plug-and-Play Script

A lightweight, zero-dependency, framework-agnostic JavaScript accessibility widget designed to drop into any website (Static HTML, React, Angular, Vue, WordPress, PHP, Django, Node.js) with a single script tag.

---

## 🌟 Key Features

- **Zero External Dependencies:** 100% offline-ready; requires no external libraries, jQuery, CDN assets, or npm packages.
- **Complete 12 WCAG AA Settings:** Comprehensive coverage of auditory, cognitive, visual, and motor accessibility criteria.
- **Multilingual Support (30+ Languages):** Full live UI translation across English, Tamil, Hindi, Spanish, French, German, Chinese, Japanese, and more, complete with authentic Vector SVG country flags.
- **Real Page Overrides:** Unlike superficial styling widgets, this widget directly interacts with host DOM elements to pause CSS and SVG animations, prevent intrusive media autoplay, extract key content summaries, and manage keyboard navigation landmarks.
- **LocalStorage Persistence:** User selections and accessibility profiles are automatically preserved across browser reloads.

---

## 🚀 How to Use / Integrate

### Option 1: Drop into Any HTML Page (Recommended)
Copy `accessibility-widget.js` into your project directory and add this single line before the closing `</body>` tag of your HTML:

```html
<script src="accessibility-widget.js"></script>
```

Or reference it from an assets/public directory:
```html
<script src="/path/to/accessibility-widget.js"></script>
```

Once loaded, the widget automatically injects a floating accessibility trigger button in the bottom-right corner of the page.

### Option 2: Live Local Demo
Open `demo.html` in any browser or serve the project locally using Python or Docker:
- **Windows Batch Launcher:** Double-click `start-server.bat` to launch at `http://localhost:1434/`.
- **Docker:** Run `docker compose up -d --build` and open `http://localhost:1434/`.

---

## 📋 Comprehensive 12 Accessibility Settings (WCAG AA)

| # | Setting | WCAG Criterion | Description & Functionality |
|---|---|---|---|
| 1 | **Live Captions** | WCAG 1.2.2 (Captions) | Scans for native `<video>` elements and YouTube embeds; attaches a real-time, responsive floating subtitle bar (`CC LIVE`) synchronized with playback. |
| 2 | **Audio Transcripts** | WCAG 1.2.1 (Audio/Video Only) | Renders an expandable `📄 Audio Transcript & Dialogue Summary` panel underneath `<video>` and `<audio>` players for deaf and hard-of-hearing users. |
| 3 | **Pause Animations** | WCAG 2.2.2 (Pause, Stop, Hide) | Freezes all CSS animations (`animation-play-state: paused`), pauses SVG `<animate>` elements, and halts `<marquee>` loops across the webpage. |
| 4 | **Reduce Motion** | WCAG 2.3.3 (Animation from Interactions) | Suppresses parallax, bouncy transitions, and smooth scrolling (reduced to 0.001ms) to protect users with vestibular motion sensitivity. |
| 5 | **Stop Auto Playing Media** | WCAG 1.4.2 (Audio Control) | Automatically pauses background media attempting to autoplay upon page load, while seamlessly allowing user-initiated playback without interruption. |
| 6 | **Content Summarization** | WCAG 3.1.5 (Reading Level) | Employs an extractive text analysis algorithm to distill dense, multi-paragraph articles into up to 5 clear, structured bullet points. |
| 7 | **Reading Process Indicators** | WCAG 2.2 / 3.1 | Displays a 4px progress indicator at the viewport top along with a floating real-time percentage badge (`📖 45% Read (~2 min left)`). |
| 8 | **Distraction-Free Mode** | WCAG 2.2 (Focus / Timing) | Conceals intrusive ads, floating banners, and sidebars, spotlighting the core article content for readers with ADHD and cognitive focus needs. |
| 9 | **Simplified Navigation** | WCAG 2.4.1 / 2.4.7 (Focus Visible) | Provides a quick `⏭ Skip to Main Content` shortcut (**`Alt + S`**), landmark indicators (`[HEADER]`, `[NAV]`, `[MAIN]`, `[FOOTER]`), and 4px high-contrast focus rings. |
| 10 | **Step-by-Step Instructions** | WCAG 3.3.2 (Labels / Instructions) | Automatically discovers multi-step form sequences, wizard stages, and headings, rendering a structured floating guide dock (`Step X of Y`). |
| 11 | **Visual Notifications** | WCAG 1.4.1 / 2.2.1 | Replaces auditory alerts, form validation failures (`:invalid`), and `aria-live` system notices with an ambient screen-edge flash and floating alert cards. |
| 12 | **Extended Time Limits** | WCAG 2.2.1 (Timing Adjustable) | Displays an interactive session extension dock (`+10 Min Extension`) and emits periodic user-activity keep-alive signals to prevent unexpected portal timeouts. |

---

## 📁 Repository Structure

```
.
├── accessibility-widget.js     # Production-ready standalone widget script
├── demo.html                   # Interactive live test portal
├── dist/                       # Static web assets & bundle
│   ├── accessibility-widget.js # Deployed widget script
│   └── index.html              # Demo portal page
├── standalone-widget/          # Standalone distribution folder
│   ├── accessibility-widget.js # Standalone script
│   ├── demo.html               # Dedicated demo page
│   └── README.md               # Standalone documentation
├── Dockerfile                  # Container build file
├── compose.yaml                # Docker compose configuration
├── nginx.conf                  # Nginx server configuration
├── start-server.bat            # One-click Windows local server
├── start-docker.bat            # One-click Docker container runner
└── README.md                   # English documentation (this file)
```

---

## 🛠️ Testing & Verification

1. Double-click `demo.html` in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
2. Click the floating blue accessibility button at the bottom-right corner.
3. Test any toggle (e.g., **Pause Animations**, **Stop Autoplay**, **Visual Notifications**, **Simplified Navigation**) and observe real-time page changes.
4. Try keyboard navigation: press **`Alt + S`** to skip straight to the main content area.
5. Switch languages from the top-right language picker (e.g., English, Tamil, Hindi, Spanish) to verify instant UI localization and SVG flag rendering.
