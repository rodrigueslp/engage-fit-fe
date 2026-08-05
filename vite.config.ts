import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    proxy: {
      '/api': process.env.VITE_DEV_API_PROXY_TARGET ?? 'http://localhost:8080',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_DEV_API_PROXY_TARGET ?? 'http://localhost:8080',
    },
  },
});
