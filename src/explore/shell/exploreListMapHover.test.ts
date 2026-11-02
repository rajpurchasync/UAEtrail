import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('explore list → map pin hover', () => {
  it('wires list hover onto map pin emphasis', () => {
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    const itemLink = read('src/list/explorer/ListExplorerItemLink.tsx');
    expect(model).toMatch(/highlightedExploreItemId/);
    expect(model).toMatch(/setHighlightedExploreItemId/);
    expect(mapShell).toMatch(/highlightedExploreItemId=\{highlightedExploreItemId\}/);
    expect(itemLink).toMatch(/setListHoverExploreItemId/);
  });
});
