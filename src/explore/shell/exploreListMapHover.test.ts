import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('explore list → map pin hover', () => {
  it('wires list hover into PlacesMap highlight', () => {
    const model = read('src/explore/shell/useExploreExperienceModel.ts');
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    const shared = read('src/explore/shell/useExploreBrowsePanelShared.ts');

    expect(model).toMatch(/highlightedExploreItemId/);
    expect(model).toMatch(/onListItemHover/);
    expect(shared).toMatch(/onListItemHover/);
    expect(mapShell).not.toMatch(/highlightedExploreItemId=\{null\}/);
    expect(mapShell).toMatch(/highlightedExploreItemId=\{highlightedExploreItemId\}/);
  });
});
