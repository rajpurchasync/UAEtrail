import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
for (const dir of ['node_modules/.vite', '.vite']) {
  rmSync(join(root, dir), { recursive: true, force: true });
}
console.log('[vite] Cleared optimizeDeps cache — restart dev server (use npm run dev:fresh if 504 persists).');
