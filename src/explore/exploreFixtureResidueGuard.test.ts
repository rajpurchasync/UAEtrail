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

const listProductionSources = (): string[] =>
  listGitTrackedFiles('"src/**/*.ts" "src/**/*.tsx"').filter(
    (file) =>
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.tsx') &&
      file !== 'src/explore/exploreMapItemFixtures.ts'
  );

describe('exploreFixtureResidueGuard', () => {
  it('production code does not import exploreMapItemFixtures', { timeout: 30_000 }, () => {
    const pattern = /from\s+['"][^'"]*exploreMapItemFixtures['"]/;
    const violations: string[] = [];
    for (const file of listProductionSources()) {
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('tests do not introduce new source: demand map rows (use seekingExploreMapItem)', { timeout: 30_000 }, () => {
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
