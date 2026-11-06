import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { devQrPlugin } from './scripts/vite-plugin-dev-qr.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = process.env.API_BASE_URL || env.API_BASE_URL || 'http://127.0.0.1:4000';

  return {
    plugins: [tailwindcss(), react(), devQrPlugin()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
      alias: [
        {
          find: '@/chat',
          replacement: path.resolve(projectRoot, 'src/components/chat/index.ts'),
        },
        { find: '@', replacement: path.resolve(projectRoot, 'src') },
      ],
    },
    server: {
      port: 5175,
      strictPort: true,
      host: true,
      warmup: {
        clientFiles: ['./src/main.tsx', './src/pages/Home.tsx', './src/App.tsx'],
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/og': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/sitemap-activities.xml': {
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
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-dev-runtime',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
      ],
    },
    build: {
      cssCodeSplit: true,
      // Fewer parallel /assets/* fetches — helps Docker Desktop port-forward on Windows.
      modulePreload: false,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('react-leaflet')) return 'vendor-map-react-leaflet';
            if (id.includes('leaflet.markercluster')) return 'vendor-map-cluster';
            if (id.includes('leaflet')) return 'vendor-map-leaflet';
            if (id.includes('@react-oauth') || id.includes('google-auth')) return 'vendor-google';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@capacitor')) return 'vendor-capacitor';
          },
        },
      },
    },
  };
});
