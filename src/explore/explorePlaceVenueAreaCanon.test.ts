import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * Place · Facility · Area — see DOMAIN_CANONICALS §12.1.1.
 */
describe('explore Place / Facility / Area canon', () => {
  it('routes catalog place pins to Place peek — not activity sheet or area peek', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/isGeographyMapSource\(selected\.source\)/);
    expect(stage).toMatch(/PlaceMapPeekHost/);
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

  it('Area hub peek modules stay off Place peek body', () => {
    const slots = read('src/explore/ui/map-peek/mapPeekSlots.tsx');
    expect(slots).toMatch(/card\.kind === 'destination'/);
    expect(slots).toMatch(/DestinationPeekActions/);
    const placeBody = read('src/explore/ui/peek/place/PlacePeekBody.tsx');
    const placeHero = read('src/explore/ui/peek/place/PlacePeekHero.tsx');
    expect(placeBody).not.toMatch(/source === 'area'/);
    expect(placeHero).toMatch(/resolvePlacePeekCuratedDestination/);
  });

  it('GEO: vocabulary module names Place and Facility wire sources', () => {
    expect(read('src/place/geographyVocabulary.ts')).toMatch(/MapPlaceWireSource/);
    expect(read('src/place/geographyVocabulary.ts')).toMatch(/MapFacilityWireSource/);
  });

  it('documents hierarchy in Tier-1 domain canon', () => {
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place · Facility · Destination \(Destination is a name, not a pin\)/);
    expect(canon).toMatch(/source: place/);
    expect(canon).toMatch(/source: facility/);
    expect(canon).toMatch(/source: area/);
    expect(canon).toMatch(/place\.destinationId/);
  });
});

