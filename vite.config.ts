import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devQrPlugin } from './scripts/vite-plugin-dev-qr.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devQrPlugin()],
  server: {
    port: 5175,
    strictPort: true,
    host: true,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5175,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
