import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const outDir = mode === 'firefox' ? 'dist-firefox' : 'dist-chrome';
        const manifestSrc = mode === 'firefox' ? 'manifest_firefox.json' : 'manifest.json';
        if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
        try {
          copyFileSync(manifestSrc, `${outDir}/manifest.json`);
        } catch (e) {
          console.warn('Could not copy manifest:', e);
        }
      },
    },
  ],
  build: {
    outDir: mode === 'firefox' ? 'dist-firefox' : 'dist-chrome',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'dashboard.html'),
        popup: resolve(__dirname, 'popup.html'),
        blocked: resolve(__dirname, 'blocked.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/tracker.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/index.js';
          if (chunk.name === 'content') return 'content/tracker.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}));
