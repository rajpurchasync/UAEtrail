import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { listGitTrackedFiles } from '../testing/gitTrackedFiles';

const ALLOWLIST = new Set([
  'src/explore/exploreMapItemFixtures.ts',
  'src/explore/exploreMapItemWireGuard.test.ts',
  'src/explore/exploreFixtureResidueGuard.test.ts',
  'src/explore/exploreActivityMode.test.ts',
  'src/explore/exploreBrowseTaxonomy.test.ts',
  'src/explore/exploreCopy.test.ts',
  'src/explore/exploreEntityFollowTarget.test.ts',
  'apps/api/tests/explore-plan-projection.test.ts',
]);

const listTestFiles = (): string[] => listGitTrackedFiles('"**/*.test.ts"');

describe('exploreFixtureResidueGuard', () => {
  it('tests do not introduce new source: demand map rows (use seekingExploreMapItem)', () => {
    const violations: string[] = [];
    const pattern = /source:\s*['"]demand['"]/;
    for (const file of listTestFiles()) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
