import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SCAN_GLOBS = [
  'git ls-files "src/explore/**/*.ts" "src/explore/**/*.tsx" "src/list/**/*.ts" "src/list/**/*.tsx" "src/pages/activities/**/*.tsx" "apps/api/src/**/*.ts"',
];

const ALLOWLIST = new Set([
  'src/explore/exploreMapItemFixtures.ts',
  'src/explore/exploreMapItemWireGuard.test.ts',
  'src/explore/exploreActivityMode.test.ts',
]);

const BANNED = [
  { pattern: /\bitem\.source\s*===\s*['"]demand['"]/, hint: 'Use exploreMapItemIsSeeking(item)' },
  { pattern: /\bitem\.source\s*!==\s*['"]demand['"]/, hint: 'Use !exploreMapItemIsSeeking(item) or isTimeBoundExploreMapItem' },
];

const listFiles = (): string[] => {
  const raw = SCAN_GLOBS.map((cmd) => execSync(cmd, { encoding: 'utf8' }).trim()).join('\n');
  return [...new Set(raw.split('\n').filter(Boolean))].filter((f) => !ALLOWLIST.has(f));
};

describe('exploreMapItemWireGuard (M0)', () => {
  it('map/list code does not branch on legacy item.source === demand', () => {
    const violations: string[] = [];
    for (const file of listFiles()) {
      const content = readFileSync(file, 'utf8');
      for (const rule of BANNED) {
        if (rule.pattern.test(content)) {
          violations.push(`${file} — ${rule.hint}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
