import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { listGitTrackedFiles } from '../testing/gitTrackedFiles';

const SCAN_PATHSPECS = [
  '"src/explore/**/*.ts" "src/explore/**/*.tsx"',
  '"src/list/**/*.ts" "src/list/**/*.tsx"',
  '"src/pages/activities/**/*.tsx"',
  '"apps/api/src/**/*.ts"',
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
  const files = SCAN_PATHSPECS.flatMap((pathspec) => listGitTrackedFiles(pathspec));
  return [...new Set(files)].filter((f) => !ALLOWLIST.has(f));
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
