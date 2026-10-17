import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectTsUnder = (dir: string): string[] => {
  const root = join(process.cwd(), dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  };
  walk(root);
  return files;
};

const ALLOWLIST = new Set([
  'src/api/apiLegacyGuard.test.ts',
  'src/config/seekingPostsHttpGuard.test.ts',
]);

describe('seekingPostsHttpGuard (COH-01)', () => {
  it('app code does not call removed /me/participant-intents HTTP paths', () => {
    const violations: string[] = [];
    for (const file of collectTsUnder('src')) {
      if (ALLOWLIST.has(file)) continue;
      const content = read(file);
      if (content.includes('/me/participant-intents')) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
