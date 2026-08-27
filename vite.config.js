import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves this project site from /tirang-shop/, not the domain root.
  base: process.env.GITHUB_PAGES ? '/tirang-shop/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    // The bot talks to server/index.mjs so the API key never reaches the browser.
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
