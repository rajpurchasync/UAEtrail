import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** S4 / R8.1 — product layers use hooks facades + `api/types`, not `api/index`. */
const SCAN_ROOTS = [
  'src/discovery',
  'src/context',
  'src/member',
  'src/member-plan',
  'src/wishlist',
  'src/activity',
].map((rel) => join(process.cwd(), rel));

const API_INDEX_IMPORT = /from ['"][^'"]*\/api(?:\/index)?['"]/;

const collectSourceFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('consumerApiIndexGuard (S4 / R8.1)', () => {
  it('discovery, context, member, and activity layers do not import api/index', () => {
    const files = SCAN_ROOTS.flatMap((root) => collectSourceFiles(root));
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (API_INDEX_IMPORT.test(source)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `Use src/hooks/*Api or src/api/types — not api/index:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
