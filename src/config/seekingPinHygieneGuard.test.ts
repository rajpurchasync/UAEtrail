import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

/**
 * R4 exit — legacy `pin=demand:` deep links only in redirect/resolver modules (+ this test).
 * New product surfaces should emit `pin=activity:{id}`.
 */
const PIN_DEMAND_LITERAL_ALLOWLIST = new Set([
  'src/utils/notificationRouting.ts',
  'src/config/seekingPinHygieneGuard.test.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('seekingPinHygieneGuard (R4 exit)', () => {
  it('app code does not embed pin=demand: outside legacy redirect allowlist', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      if (PIN_DEMAND_LITERAL_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (content.includes('pin=demand:')) {
        violations.push(file);
      }
    }

    expect(
      violations,
      `Legacy pin=demand: URLs belong in notificationRouting (rewrite) or tests only:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
