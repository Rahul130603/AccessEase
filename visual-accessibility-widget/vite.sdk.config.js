import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const fontLicense = readFileSync(new URL('./src/assets/fonts/opendyslexic/OFL.txt', import.meta.url), 'utf8');
const licenseBanner = ['Bundled OpenDyslexic font license:', ...fontLicense.split(/\r?\n/)]
  .map(line => `//! ${line}`).join('\n');

export default defineConfig({
  publicDir: false,
  plugins: [{
    name: 'validate-standalone-javascript',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          new Script(file.code, { filename: file.fileName });
          if (!file.code.includes('SIL OPEN FONT LICENSE')) this.error('The bundled font license must be retained.');
        }
      }
    },
  }],
  build: {
    emptyOutDir: false,
    rollupOptions: { output: { banner: licenseBanner } },
    lib: { entry: 'sdk/bootstrap.js', name: 'AccessibilityWidgetBundle', formats: ['iife'], fileName: () => 'accessibility-widget.js' },
  },
});
