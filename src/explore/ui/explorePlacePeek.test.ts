import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('place map peek', () => {
  it('uses structured body and compact footer tiles without maps-app chevron', () => {
    const preview = read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx');
    const actions = read('src/explore/ui/peek/place/PlacePeekActions.tsx');
    const body = read('src/explore/ui/peek/place/PlacePeekBody.tsx');
    const hero = read('src/explore/ui/peek/place/PlacePeekHero.tsx');
    const kindFacts = read('src/explore/ui/peek/place/PlacePeekKindFacts.tsx');

    expect(preview).toMatch(/PlacePeekCard/);
    expect(read('src/explore/ui/peek/PlacePeekCard.tsx')).toMatch(/catalogPlaceSummary/);
    const shell = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    expect(shell).toMatch(/showPlaceCatalogHero/);
    expect(shell).toMatch(/catalogPlaceSummary/);
    expect(kindFacts).toMatch(/resolvePlacePeekTrailFactsFromCard/);
    expect(hero).toMatch(/resolvePlacePeekCuratedArea/);
    expect(body).toMatch(/fetchPlaceActivities/);
    expect(actions).toMatch(/PLACE_PEEK_FOOTER_PLAN_TRIP/);
    expect(actions).toMatch(/navigateHostFromPlaceCard/);
    expect(actions).toMatch(/grid-cols-3/);
    expect(actions).toMatch(/PLACE_PEEK_FOOTER_TRIP_ALERTS/);
    expect(actions).toMatch(/useExploreWishlistSave/);
    expect(hero).toMatch(/ExploreWishlistSaveButton/);
  });
});

