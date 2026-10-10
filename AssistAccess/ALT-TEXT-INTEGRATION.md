# AI alt text and approved corrections

The existing image audit scans ordinary visible `<img>` elements in the host document. The widget's Shadow DOM is excluded. Missing `alt` is a finding; `alt=""` is treated as potentially decorative; suspicious existing text is offered for review. The shared debounced observer detects images inserted later, and two capture listeners on `document` re-run the scan when an image finishes loading or fails — a lazy image below the fold has no rendered box while it is still loading and would otherwise be missed, because loading an image does not mutate the DOM. CSS backgrounds, inline SVG, canvas, and cross-origin iframe contents are outside this scanner.

The image card keeps generation, editing, Locate, Apply Alt, Mark Decorative, Undo, and save actions together. **Generate Alt Text sends image bytes to the configured AI provider only after the user checks the disclosure box and clicks Generate.** The proposal remains editable and is not applied automatically. Apply and Mark Decorative verify the original live image and its attributes, change only `alt`, then verify the resulting DOM value. Undo works during the page session if the host has not changed that image. A React/Vue/etc. host can overwrite temporary DOM changes on rerender; the widget reports this and does not fight the framework.

## Backend and provider

There was no backend in this project. `server/altTextApi.mjs` is a framework-neutral Node HTTP handler; `server/start.mjs` runs it as a sidecar. The provider interface is `generate({ bytes, mimeType, context }) -> { suggestion, complex }`. `server/altTextProvider.mjs` supplies a real OpenAI Responses image-input implementation and a deterministic test provider. The browser never receives the AI API key. The server never fetches a supplied URL, so it cannot be directed to an internal network address. It validates bearer scope, tenant, authorized origin, byte size, MIME signature, SHA-256, request rate, and generated text. Images are held in memory for the request and are not stored in SQLite.

Use Node 24 or later for the built-in SQLite store (`node:sqlite` currently prints an experimental warning). Configure these **server-only** environment variables:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Required for real generation; never place it in Vite variables or browser config. |
| `ASSISTACCESS_OPENAI_MODEL` | Vision-capable Responses model; defaults to `gpt-4.1-mini`. |
| `ASSISTACCESS_TOKEN_SECRET` | Random signing secret of at least 32 characters. |
| `ASSISTACCESS_SITES_JSON` | JSON object mapping each tenant site ID to `origins`, `allowAI`, and `allowPersistence`. |
| `ASSISTACCESS_DB_PATH` | Durable SQLite correction database path. Back up and protect this file. |
| `ASSISTACCESS_API_PORT` | API listening port; defaults to 8787. |

Example site registry (supply it through the server environment, not client code):

```json
{"acme":{"origins":["https://www.acme.example"],"allowAI":true,"allowPersistence":true}}
```

Run `npm run build` and `npm run alt-api`. Reverse proxy `https://www.acme.example/api/assistaccess/alt-text/*` to the API server. The browser client requires this same-origin path. Use HTTPS on the customer site. Configure CSP `connect-src` for its own image/API origin and any explicitly CORS-enabled image CDN. The browser downloads only PNG, JPEG, or WebP images up to 5 MB. Same-origin requests may use site cookies to fetch an authorized image; cross-origin requests omit credentials and succeed only if that server permits CORS. A broken, protected, too-large, or unsupported image gives a visible retryable error. Neither the client nor server assumes arbitrary cross-origin image bytes are readable.

OpenAI's Responses API accepts an `input_image` with a base64 data URL in `image_url`; the provider sends `store: false`. Check current model availability and the provider's data-handling terms before enabling this feature for customers. The model may miss context, misread text, or hallucinate; a human must review each description. Charts and diagrams are flagged when the model marks them complex and may need a longer explanation in the customer website.

## Customer configuration

The built script-tag bundle is `dist/embed/assistaccess.js`. Set config before loading it:

```html
<script>
window.AssistAccessConfig = {
  altText: {
    enabled: true,
    siteId: 'acme',
    endpoint: '/api/assistaccess/alt-text',
    allowExternalProcessing: true,
    disclosure: 'I allow this image and limited nearby text to be processed by our configured AI provider for an alt-text suggestion.',
    getToken: async () => {
      const response = await fetch('/accessibility-token', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Authorization unavailable');
      return (await response.json()).token;
    },
    persistence: { enabled: true, autoApply: true, canWrite: false },
  },
};
</script>
<script defer src="/assets/assistaccess.js"></script>
```

The customer-controlled `/accessibility-token` endpoint must authenticate the user and issue a short-lived signed token on its **server** using `issueSiteToken(secret, { siteId: 'acme', origin: 'https://www.acme.example', scopes })`. Give normal authorized viewers `['read', 'generate']` only when they may request AI suggestions. Give an authenticated editor/admin `['read', 'generate', 'write']` and set `canWrite: true` in that editor's widget config. Never expose `ASSISTACCESS_TOKEN_SECRET` in page JavaScript. The API checks `write` for save and delete even if the UI is misconfigured. A site can leave generation disabled and still use manual Apply/Decorative/Undo.

`allowExternalProcessing` and the disclosure must reflect the customer's privacy policy and actual authorization. The user confirms each image transfer in the card. The server validates the tenant and domain; no wildcard CORS access is configured. The customer must decide whether its content and audience permit transmission to the selected AI provider.

## Persistence and limits

Temporary Apply/Decorative edits affect only the current DOM. An authorized editor can click **Save correction** after a verified apply. Saving requires a stable, site-owner-supplied ID on the image:

```html
<img src="/charts/q4.png" data-assistaccess-image-id="q4-sales-chart">
```

The durable key combines tenant site ID, page pathname, stable image ID, and SHA-256 of the image bytes. A filename or DOM position alone is never accepted. The SQLite row has a version and timestamp. Re-saving updates the row; **Remove saved correction** deletes it. If `autoApply` is configured, the widget checks an image with no alt against authorized saved records on later visits and applies only an exact match. It does not overwrite existing alt text. A changed image byte hash or missing stable ID prevents reuse. If the image cannot be fetched or the API is unavailable, it remains unchanged. Saving never edits source code or the customer's database.

For a permanent markup fix, the customer should put the reviewed text in its own template or content system. This widget cannot inspect a cross-origin iframe or guarantee that AI text is correct. The presence of alt text alone does not establish WCAG compliance.

## Deterministic tests and optional real-provider check

| Command | What it proves |
| --- | --- |
| `npm run test:alt` | Server and workflow suite: a mock image-understanding provider receives real PNG bytes (`server/tests/altTextApi.test.mjs`); the OpenAI provider builds the correct Responses request, parses the answer and refuses malformed output (`server/tests/altTextProvider.test.mjs`); corrections persist per tenant, page, stable id and byte hash; unauthorized, cross-origin, wrong-tenant, read-only, oversized and rate-limited requests are refused; a tenant without AI or a server without a provider answers `503` with a configuration error instead of a suggestion; SVG bytes and unusable model text are refused; applying, verifying and undoing alt text on a host image leaves `src` untouched. |
| `npm run test:browser:alt` | The whole workflow in a real Chrome against `test-host/index.html`: detect missing alt, generate (mock provider), populate the input, edit, apply to the real `<img>`, undo, mark decorative, refuse to name-strip a linked image, report a broken source, detect an inserted image, save a correction, reload and auto-apply it, stay inside the viewport at 764px and 375px, close on Escape and open by keyboard. |
| `npm run test:browser:alt:edges` | The states the happy path does not cover, all in the same real browser: the widget never reports its own interface; a small `alt=""` image is decorative, not an error; existing alt text is left alone; an SVG source reports the format limitation with no suggestion; a failed request shows a retryable error and produces no suggestion, and retrying succeeds; the request carries site, MIME type, 64-character byte hash and page context; a deferred image is reported once it loads; a dynamic image is one finding even after widget-driven updates; the result is announced in `role="status"`; a site with no service says so and still allows a manual reviewed edit; a site whose server has no provider shows the server's configuration error; a cross-origin image without CORS headers is reported as unreadable and is never sent to the service. |
| `npm run test:alt:live` | Opt-in only. Skipped unless `OPENAI_API_KEY` is set; sends one real image to the configured model and checks the answer is non-empty, concise and not a file name. It asserts shape, never wording or quality. |

`npm run check` and `npm run build` run the existing checks and production builds. `test-host/index.html` is an independent HTML site with ordinary images, a linked image, a broken source, a text image, a vector source, an image inserted later, and a lazy image far below the fold; it loads the built IIFE through a script tag without importing React. `test-host/no-ai.html` (no service configured), `test-host/no-provider.html` (server refuses AI for the tenant) and `test-host/cross-origin.html` (an image from a CORS-less second origin, started by the edge-case script itself) cover the three configuration and reachability failures.

For the local browser workflow only, set `ASSISTACCESS_TEST_MODE=1`, a test signing secret, and a site registry for `http://127.0.0.1:8787`; run `npm run alt-api`, then `node test-host/browser-test.mjs` and `node test-host/browser-alt-edges.mjs`. Test mode binds to loopback, serves `test-host/*.html` and its images, and exposes a test token endpoint that issues a token for any registered site named in its `siteId` query parameter. Never set it in production. Both browser scripts use a deterministic mock provider to verify the UI, real host DOM updates, undo, dynamic detection, error handling, save/reload, responsive panel bounds, Escape, and console errors.

An optional live provider check requires a real `OPENAI_API_KEY`, a registered HTTPS origin, the same-origin API proxy, and an authorized token endpoint. Disable test mode so `createOpenAIProvider` is selected. Generate from a known test image, compare the proposal with the actual image and context, edit as needed, then apply. Live-provider output and quality are deliberately not asserted by the deterministic suite.

## What has been verified, and what has not

| Area | Status |
| --- | --- |
| Detection on a real host page (missing, empty, meaningful, file-name alt; deferred and inserted images; broken and vector sources) | **Verified** in headless Chrome against `test-host/`, with the widget's own shadow-DOM images excluded and five host findings reported. |
| Generation plumbing: browser → same-origin API → provider interface → input population | **Verified with a deterministic mock provider** (real bytes, real HTTP, real DOM). |
| Real model call | **Verified against a stub `fetch`**: the request carries base64 image bytes, `store: false`, the configured model and the safety instructions; malformed or failed answers are rejected. **Not verified against the live OpenAI service in this environment** — no `OPENAI_API_KEY` was available, so `npm run test:alt:live` reports itself skipped. Supply a key and run it to close that gap. |
| Applying, marking decorative, undo, announcement | **Verified** on the real host DOM, including a dynamically inserted image, with `src` unchanged and the outcome written to the `role="status"` live region. |
| Persistence (save, reload, exact-match auto-apply) | **Verified** with SQLite in test mode: save → reload → auto-applied; a changed byte hash or a missing stable id yields no match. |
| Failure and configuration states | **Verified**: broken image, unsupported format, blocked network, cross-origin image without CORS headers (the page renders it, the widget cannot read it, nothing is sent), site without a service, server without a provider (503), unusable model text (502), oversized body (413), rate limit (429). |
| Layout audit regression | **Verified**: `npm run audit:layout` reports 0 findings at 1440/1024/768/390px, 0 axe violations in both colour schemes, and 25 keyboard stops all with a visible outline, after the alt-text work. |

Temporary DOM edits are still temporary: nothing here writes the customer's templates, CMS records or source files, and the widget cannot see inside a cross-origin iframe. Reproducing a correction on later visits is limited to exact matches in the configured store, and only where the site owner supplies a stable `data-assistaccess-image-id`.
