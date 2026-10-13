import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TESTS_DIR = join(process.cwd(), 'tests');

const collectTestFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'helpers') continue;
      out.push(...collectTestFiles(full));
    } else if (entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
};

describe('test-seed coherence', () => {
  it('vitest files do not hardcode area-seed-* ids (use test-seed / curatedAreaSeedId)', () => {
    const violations: string[] = [];
    for (const file of collectTestFiles(TESTS_DIR)) {
      const content = readFileSync(file, 'utf8');
      if (/area-seed-[a-z0-9-]+/.test(content)) {
        violations.push(file.replace(/\\/g, '/'));
      }
    }
    expect(violations).toEqual([]);
  });
});
