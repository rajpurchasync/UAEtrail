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
  { pattern: /\bitem\.hostName\b/, hint: 'Use featuredPerson or activity.hostName' },
  { pattern: /\bitem\.hostAvatar\b/, hint: 'Use featuredPerson.avatarUrl or activity.hostAvatar' },
  { pattern: /\bitem\.requesterUserId\b/, hint: 'Use featuredPerson.userId' },
];

const API_SCAN = [
  'apps/api/src/lib/discovery-catalog-builder.ts',
  'apps/api/src/lib/availability-fixed-map-items.ts',
];

const API_BANNED = [
  {
    pattern: /hostName:\s*activity\.hostName\s*\?\?\s*null/,
    hint: 'Explore map items use featuredPerson only',
  },
  {
    pattern: /hostAvatar:\s*resolveActivityHostAvatar\(activity\)/,
    hint: 'Do not duplicate hostAvatar on ExploreMapItemDTO',
  },
  { pattern: /requesterUserId:\s*owner/, hint: 'Do not emit requesterUserId on map items' },
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

  it('GW-10: catalog builders do not emit legacy explore map person fields', () => {
    const violations: string[] = [];
    for (const file of API_SCAN) {
      const content = readFileSync(file, 'utf8');
      for (const rule of API_BANNED) {
        if (rule.pattern.test(content)) {
          violations.push(`${file} — ${rule.hint}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
