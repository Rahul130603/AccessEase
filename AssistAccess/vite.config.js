import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite setup for the accessibility module.
 *
 * There are two pages to look at, and both are real entries (so `vite build` compiles
 * the whole module graph through either of them):
 *
 *   /demo/                                  a realistic marketing page with the widget,
 *                                           plus four deliberate faults for the audit
 *   /src/accessibility/integration/devHarness/
 *                                           the hostile host app: aggressive global CSS,
 *                                           fixed/sticky elements, animation fixtures,
 *                                           excluded zones and media stubs
 *
 * The module itself needs no build configuration: it ships no CSS imports (the widget
 * stylesheet is adopted as text inside the shadow root) and no dependencies beyond React.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // Headless runs (CI, the layout audit) must not pop a browser window.
    open: process.env.VITE_HEADLESS ? false : '/demo/',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        demo: fileURLToPath(new URL('./demo/index.html', import.meta.url)),
        harness: fileURLToPath(
          new URL('./src/accessibility/integration/devHarness/index.html', import.meta.url),
        ),
      },
    },
  },
});
