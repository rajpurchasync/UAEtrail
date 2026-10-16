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
    expect(stage).toMatch(/source === 'venue'[\s\S]*?PlaceMapPeekHost/);
  });

  it('uses catalog place summary only on Place map preview (venue wire)', () => {
    const preview = read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx');
    const placePeek = read('src/explore/ui/peek/PlacePeekCard.tsx');
    expect(preview).toMatch(/PlacePeekCard/);
    expect(placePeek).toMatch(/catalogPlaceSummary/);
    const shell = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    expect(shell).toMatch(/PlacePeekBody/);
    expect(shell).not.toMatch(/ExploreVenuePeek/);
  });

  it('Area lens peeks use area pin modules — not Place peek body', () => {
    const slots = read('src/explore/ui/map-peek/mapPeekSlots.tsx');
    expect(slots).toMatch(/card\.source === 'area'/);
    expect(slots).toMatch(/AreaPeekActions/);
    const placeBody = read('src/explore/ui/peek/place/PlacePeekBody.tsx');
    const placeHero = read('src/explore/ui/peek/place/PlacePeekHero.tsx');
    expect(placeBody).not.toMatch(/source === 'area'/);
    expect(placeHero).toMatch(/resolvePlacePeekCuratedArea/);
  });

  it('GEO: place peek uses venue wire vocabulary module', () => {
    expect(read('src/place/geographyVocabulary.ts')).toMatch(/MapVenueWireSource/);
    expect(read('src/place/placePeekPresentation.ts')).toMatch(/`venue`/);
  });

  it('documents hierarchy in Tier-1 domain canon', () => {
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place vs `venue`/);
    expect(canon).toMatch(/ExploreCardSource: 'venue'/);
    expect(canon).toMatch(/source: 'area'/);
    expect(canon).toMatch(/place\.areaId/);
  });
});

