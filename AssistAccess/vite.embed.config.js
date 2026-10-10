import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    sourcemap: true,
    lib: { entry: 'src/accessibility/integration/embed.jsx', name: 'AssistAccess', formats: ['iife'], fileName: () => 'assistaccess.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
