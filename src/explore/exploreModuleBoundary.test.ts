import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const listExploreSourceFiles = (): string[] =>
  execSync('git ls-files "src/explore/**/*.ts" "src/explore/**/*.tsx"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

describe('explore module boundary', () => {
  it('does not import utils/exploreRouting shim (use src/explore/routing.ts)', () => {
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
