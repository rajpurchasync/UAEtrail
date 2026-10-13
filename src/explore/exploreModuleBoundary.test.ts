import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { listGitTrackedFiles } from '../testing/gitTrackedFiles';

const listExploreSourceFiles = (): string[] =>
  listGitTrackedFiles('"src/explore/**/*.ts" "src/explore/**/*.tsx"');

describe('explore module boundary', () => {
  it('does not import config/routingCatalog shim (use src/explore/routing.ts)', () => {
    const violations: string[] = [];

    for (const file of listExploreSourceFiles()) {
      const content = readFileSync(file, 'utf8');
      if (/utils\/exploreRouting/.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
