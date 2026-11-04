import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(apiRoot, 'data');
const targetDir = path.join(apiRoot, 'dist', 'data');

if (!fs.existsSync(sourceDir)) {
  console.warn('[copy-dist-data] No apps/api/data directory — skipping.');
  process.exit(0);
}

fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('[copy-dist-data] Copied data/ → dist/data/');
