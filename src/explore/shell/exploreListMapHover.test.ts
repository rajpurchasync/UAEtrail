import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('explore list → map pin hover', () => {
  it('keeps map highlight wiring without a catalog list sidebar', () => {
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    expect(model).toMatch(/highlightedExploreItemId/);
    expect(model).not.toMatch(/onListItemHover/);
    expect(mapShell).toMatch(/highlightedExploreItemId=\{highlightedExploreItemId\}/);
  });
});
