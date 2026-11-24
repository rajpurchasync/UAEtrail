import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@/chat',
        replacement: path.resolve(projectRoot, 'src/components/chat/index.ts'),
      },
      { find: '@', replacement: path.resolve(projectRoot, 'src') },
      {
        find: '@uaetrail/shared-types',
        replacement: path.resolve(projectRoot, 'packages/shared-types/src/index.ts'),
      },
    ],
  },
  test: {
    pool: 'vmThreads',
    environment: 'jsdom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'packages/shared-types/src/**/*.test.ts',
    ],
  },
});
