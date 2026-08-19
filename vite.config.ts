import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { devQrPlugin } from './scripts/vite-plugin-dev-qr.mjs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), '');

  // Generic target resolution: checks process environment first, then loaded env, defaults to local loopback
  const apiTarget = process.env.API_BASE_URL || env.API_BASE_URL || 'http://127.0.0.1:4000';

  return {
    plugins: [react(), devQrPlugin()],
    server: {
      port: 5175,
      strictPort: true,
      host: true,
      proxy: {
        '/api/v1': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5175,
      strictPort: true,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});