import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * Place (entity) vs venue (explore wire) vs Area (curated hub) — see DOMAIN_CANONICALS §12.1.1.
 */
describe('explore Place / venue / Area canon', () => {
  it('routes catalog place pins to Place peek — not activity sheet or area peek', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/selected\?\.source === 'venue'/);
    expect(stage).toMatch(/source === 'venue'[\s\S]*?ExplorePlaceMapPreview/);
  });

  it('uses placePeekLayout only on Place map preview (venue wire)', () => {
    const preview = read('src/explore/ui/ExplorePlaceMapPreview.tsx');
    const peekCard = read('src/explore/ui/ExploreMapPeekCard.tsx');
    expect(preview).toMatch(/placePeekLayout/);
    expect(peekCard).toMatch(/placePeekLayout/);
    expect(peekCard).toMatch(/ExplorePlacePeekBody/);
    expect(peekCard).not.toMatch(/ExploreVenuePeek/);
  });

  it('Area lens peeks stay on ExploreItemSheet + area actions — not Place peek body', () => {
    const itemPeek = read('src/explore/ui/ExploreItemPeekParts.tsx');
    expect(itemPeek).toMatch(/card\.source === 'area'/);
    expect(itemPeek).toMatch(/ExploreAreaPeekActions/);
    const placeBody = read('src/explore/ui/ExplorePlacePeekBody.tsx');
    expect(placeBody).not.toMatch(/source === 'area'/);
    expect(placeBody).toMatch(/resolvePlacePeekCuratedArea/);
  });

  it('documents hierarchy in Tier-1 domain canon', () => {
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place vs `venue`/);
    expect(canon).toMatch(/ExploreCardSource: 'venue'/);
    expect(canon).toMatch(/source: 'area'/);
    expect(canon).toMatch(/place\.areaId/);
  });
});
