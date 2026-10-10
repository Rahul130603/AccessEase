import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: {
    outDir: fileURLToPath(new URL('../dist', import.meta.url)),
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./index.jsx', import.meta.url)),
      name: 'AccessEaseTeam', formats: ['iife'], fileName: () => 'team-features.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
