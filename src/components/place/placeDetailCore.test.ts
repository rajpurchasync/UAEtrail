import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(join(root, relativePath), 'utf8');

describe('placeDetailCore (R3 consumer)', () => {
  it('PlaceDetailPage delegates loaded UI to consumer shell', () => {
    const page = read('src/pages/PlaceDetailPage.tsx');
    expect(page).toMatch(/usePlaceDetailCore/);
    expect(page).toMatch(/PlaceDetailPageShell/);
    expect(page).not.toMatch(/PlaceDetailTabs/);
  });

  it('PLACE-KIND-FACTS-01: consumer + peek share trail / camp / event fact resolvers', () => {
    const facts = read('src/place/peek/resolvePlacePeekCatalogFacts.ts');
    expect(facts).toMatch(/resolvePlacePeekTrailFactsFromPlace/);
    expect(facts).toMatch(/resolvePlacePeekCampFactsFromPlace/);
    expect(facts).toMatch(/resolvePlacePeekEventFactsFromPlace/);
    expect(read('src/place/detail/PlaceScrollKindFacts.tsx')).toMatch(/PlaceScrollKindFacts/);
    expect(read('src/explore/ui/peek/place/PlacePeekKindFacts.tsx')).toMatch(/PlacePeekKindFacts/);
    expect(existsSync(join(root, 'src/components/place/PlaceDetailCore.tsx'))).toBe(false);
    expect(existsSync(join(root, 'src/place/detail/composers/index.ts'))).toBe(false);
  });

  it('PLACE-PAGE-MODEL-01 (S13-W8): L1 page model on consumer template', () => {
    expect(read('src/place/detail/buildPlaceDetailPageModel.ts')).toMatch(/buildPlaceDetailPageModel/);
    expect(read('src/place/detail/templates/PlaceScrollDetailPage.tsx')).toMatch(
      /buildPlaceDetailPageModel/
    );
    expect(read('src/place/detail/templates/PlaceScrollDetailPage.tsx')).toMatch(
      /PlaceScrollKindFacts/
    );
  });

  it('legacy kind page wrappers are gone (canonical PlaceDetailPage + /trail|/camp|/venue Navigate)', () => {
    for (const kindPage of [
      'src/pages/place/HikingPlaceDetailPage.tsx',
      'src/pages/place/CampingPlaceDetailPage.tsx',
      'src/pages/place/EventPlaceDetailPage.tsx',
    ]) {
      expect(existsSync(join(root, kindPage))).toBe(false);
    }

    const inboundPlace = read('src/routing/inboundBookmarkRedirects.tsx');
    expect(inboundPlace).toMatch(/InboundCanonicalPlaceRedirect/);
    expect(inboundPlace).toMatch(/canonicalPlaceDetailPath/);
    expect(read('src/pages/PlaceDetailPage.tsx')).toMatch(/CanonicalPlaceDetailPage/);
    expect(read('src/pages/FacilityDetailPage.tsx')).toMatch(/FacilityScrollDetailPage/);
  });

  it('usePlaceDetailCore centralizes fetch in hooks layer', () => {
    const hook = read('src/hooks/usePlaceDetailPage.ts');
    expect(hook).toMatch(/fetchPlaceDetail|placeDetailClientApi/);
    expect(hook).toMatch(/useQuery/);
    expect(hook).toMatch(/placeDetailCoreQueryKey/);
    expect(hook).not.toMatch(/PlaceDetailTabs/);
    expect(hook).not.toMatch(/\bapi\./);
  });

  it('activity detail templates branch by scheduled activity type', () => {
    const byKind = read('src/activity/detail/templates/ActivityDetailByKind.tsx');
    expect(byKind).toMatch(/HikingActivityDetailPage/);
    expect(byKind).toMatch(/CampingActivityDetailPage/);
    expect(byKind).toMatch(/RideshareActivityDetailPage/);
    expect(byKind).toMatch(/OtherActivityDetailPage/);
    expect(read('src/activity/detail/activityDetailKind.ts')).toMatch(/resolveActivityDetailKind/);
  });

  it('places bounded context manifest lists R3 entry points', () => {
    const manifest = JSON.parse(
      readFileSync(join(root, 'scripts/bounded-context-manifest.json'), 'utf8')
    ) as { contexts: Array<{ id: string; feRoots: string[] }> };
    const places = manifest.contexts.find((c) => c.id === 'places');
    expect(places?.feRoots).toContain('src/pages/PlaceDetailPage.tsx');
    expect(places?.feRoots).toContain('src/pages/place');
    expect(places?.feRoots).toContain('src/hooks/placeDetailClientApi.ts');
  });
});
