import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'android']);

const walk = (dir: string, files: string[] = []): string[] => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, files);
    else if (/\.(ts|tsx|mjs|js)$/.test(ent.name)) files.push(abs);
  }
  return files;
};

describe('unversioned HTTP API (no /api/v1)', () => {
  it('product source does not reference /api/v1 paths', () => {
    const roots = ['src', join('apps', 'api', 'src'), join('apps', 'api', 'tests')];
    const offenders: string[] = [];
    for (const rel of roots) {
      for (const file of walk(join(ROOT, rel))) {
        if (file.includes('apiVersioningGuard.test.ts')) continue;
        if (file.includes('dev-remove-version-suffixes.mjs')) continue;
        const text = readFileSync(file, 'utf8');
        if (text.includes('/api/v1')) offenders.push(file.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });
});
