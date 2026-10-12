import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_ROOT = join(process.cwd(), 'src');

/** R1.5 — production code builds cards via `buildDiscoveryCardViewModel*` only. */
const BUILD_EXPLORE_CARD_MODEL_ALLOWLIST = new Set([
  'src/discovery/discoveryCardViewModel.ts',
  'src/explore/exploreCardModel.ts',
]);

const usesBuildExploreCardModel = (source: string): boolean =>
  /\bbuildExploreCardModel\b/.test(source);

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

describe('discoveryCardBuilderGuard (R1.5)', () => {
  it('only discovery VM / exploreCardModel call buildExploreCardModel in app code', () => {
    const files = collectSourceFiles(SRC_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      if (BUILD_EXPLORE_CARD_MODEL_ALLOWLIST.has(file)) continue;
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesBuildExploreCardModel(source)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `Use buildDiscoveryCardViewModel / buildDiscoveryCardViewModelCard instead:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
