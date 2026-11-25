import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectTsxUnder = (dir: string): string[] => {
  const root = join(process.cwd(), dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  };
  walk(root);
  return files;
};

describe('geographyTerminologyGuard (Place · Facility · Destination)', () => {
  it('GEO-01: vocabulary module documents Place vs Facility vs Destination', () => {
    const vocab = read('src/place/geographyVocabulary.ts');
    expect(vocab).toMatch(/MapPlaceWireSource/);
    expect(vocab).toMatch(/MapFacilityWireSource/);
    expect(vocab).toMatch(/GeographyDestinationName/);
    expect(vocab).toMatch(/AdminGeo/);
    expect(vocab).toMatch(/facilities/);
    expect(read('src/explore/explorePinKindFilter.ts')).toMatch(/MAP_LENS_SPOTS_LABEL/);
    expect(read('src/content/upl-glossary.ts')).toMatch(/geographyVocabulary/);
    expect(read('src/list/browse/browseListTaxonomy.ts')).toMatch(/BROWSE_LIST_CATEGORY_PLACES/);
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/12\.1\.1 Explore UI — Place · Facility · Destination \(Destination is a name, not a pin\)/);
    expect(canon).toMatch(/source: facility/);
  });

  it('GEO-02: Place pin summary never handles Area lens source', () => {
    expect(read('src/explore/ui/peek/place/PlacePeekBody.tsx')).not.toMatch(
      /source === 'area'/
    );
    expect(read('src/explore/ui/peek/place/PlacePeekHero.tsx')).toMatch(
      /resolvePlacePeekCuratedDestination/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).toMatch(
      /card\.kind === 'destination'/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).not.toMatch(
      /card\.source === 'venue'/
    );
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).not.toMatch(
      /source === 'venue'/
    );
  });

  it('GEO-03: Place and Facility map selection uses Place peek host until facility peek ships', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/isGeographyMapSource/);
    const placeHost = read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx');
    expect(placeHost).toMatch(/PlacePeekCard/);
    expect(stage).toMatch(/PlaceMapPeekHost/);
    const peekCard = read('src/explore/ui/peek/PlacePeekCard.tsx');
    expect(peekCard).toMatch(/FacilityPeekActions/);
  });

  it('GEO-04: no new ExploreVenuePeek* implementations under peek/place', () => {
    const violations: string[] = [];
    for (const file of collectTsxUnder('src/explore/ui/peek/place')) {
      if (/ExploreVenuePeek/i.test(read(file))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('GEO-06: BWL map source is one lexicon — place + facility, not catalog_place', () => {
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(lexicon).toMatch(/PLACE: 'place'/);
    expect(lexicon).toMatch(/FACILITY: 'facility'/);
    expect(lexicon).not.toMatch(/AREA_INBOUND/);
    expect(lexicon).toMatch(/isGeographyMapSource/);
    expect(lexicon).not.toMatch(/CATALOG_PLACE_TARGET/);
    const person = read('packages/shared-types/src/explore-person.ts');
    const plan = read('packages/shared-types/src/explore-plan-projection.ts');
    expect(person).toMatch(/ExploreMapSourceWire/);
    expect(plan).toMatch(/ExploreMapSourceWire/);
    expect(person).not.toMatch(/catalog_place/);
    expect(plan).not.toMatch(/catalog_place/);
  });

  it('GEO-05: Area hub actions label facility Places distinctly from Spots rollups', () => {
    const area = read('src/explore/ui/peek/destination/DestinationPeekActions.tsx');
    expect(area).toMatch(/Facilities/);
    expect(area).toMatch(/Trails/);
    expect(area).not.toMatch(/venue/i);
  });

  it('GEO-07: MIG-DESTINATION-GEO program wire exists (§8.5 + resolveDestinationId)', () => {
    expect(read('docs/SYSTEM_COHERENCE.md')).toMatch(/MIG-DESTINATION-GEO-2026/);
    expect(read('packages/shared-types/src/destination.ts')).toMatch(/resolveDestinationId/);
    expect(read('packages/shared-types/src/destination.ts')).toMatch(/destinationHubPath/);
    expect(read('packages/shared-types/src/wire-lexicon.ts')).toMatch(/DESTINATIONS/);
  });

  it('GEO-10: explore links emit destination query only (P10)', () => {
    const routing = read('src/explore/routing.ts');
    expect(routing).toMatch(/exploreDestinationQueryParam/);
    expect(routing).not.toMatch(
      /params\.set\(exploreAreaQueryParam,\s*options\.area/
    );
  });

  it('GEO-09: GET /api/destinations canonical — no legacy areas registrar (P9)', () => {
    expect(read('apps/api/tests/destinations-http-canonical-guard.test.ts')).toMatch(
      /destinations HTTP canonical guard/
    );
    expect(read('apps/api/tests/destinations-http-canonical-guard.test.ts')).toMatch(
      /legacy GET \/api\/areas registrar removed/
    );
  });

  it('GEO-08: destination hub SPA route — no nginx or inbound /area compat (P7–P8)', () => {
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/\/destination\/:slug/);
    expect(read('nginx/snippets/inbound-bookmark-redirects.conf')).not.toMatch(
      /\/area\/\(\[\^\/\]\+\)/
    );
    expect(read('packages/shared-types/src/entity-path.ts')).not.toMatch(/STALE_AREA_HUB_PATH_RE/);
  });

  it('GEO-11: catalog query normalizers live in shared-types (Phase A)', () => {
    expect(read('packages/shared-types/src/catalog-query-normalize.ts')).toMatch(
      /normalizePlaceCatalogQuery/
    );
    expect(read('packages/shared-types/src/wire-lexicon.ts')).toMatch(/BWL_CATALOG_GEO_FIELDS/);
  });

  it('GEO-16: destination geo shims removed (Phase F)', () => {
    expect(read('apps/api/tests/destination-shim-inventory-guard.test.ts')).toMatch(
      /destination shim inventory guard/
    );
    expect(read('src/config/destinationFeWireGuard.test.ts')).toMatch(/retired shim modules stay deleted/);
  });

  it('GEO-15: FE hub facade + detail route (Phase D)', () => {
    expect(read('src/hooks/destinationHubClientApi.ts')).toMatch(/fetchDestinationDetailBySlug/);
    expect(read('src/config/destinationFeWireGuard.test.ts')).toMatch(/destinationFeWireGuard/);
    expect(read('src/pages/DestinationDetailPage.tsx')).toMatch(/DestinationDetailPage/);
  });

  it('GEO-14: admin console uses /admin/destinations (Phase E)', () => {
    expect(read('src/config/adminSurfacePaths.ts')).toMatch(/ADMIN_DESTINATIONS_PATH/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/ADMIN_DESTINATIONS_PATH/);
    expect(read('src/api/domains/destinations.ts')).toMatch(/listAdminDestinations/);
  });

  it('GEO-13: Mongo destinations alias documented in collections + BWL (Phase C)', () => {
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/DESTINATIONS: 'destinations'/);
    expect(read('apps/api/tests/destination-storage-guard.test.ts')).toMatch(
      /destination storage guard/
    );
  });

  it('GEO-12: public catalog routes call normalizers, not inline alias merge (Phase B)', () => {
    expect(read('apps/api/src/routes/user/registerPublicPlaceRoutes.ts')).toMatch(
      /normalizePlaceCatalogQuery/
    );
    expect(read('apps/api/src/routes/user/registerPublicFacilityRoutes.ts')).toMatch(
      /normalizeFacilityCatalogQuery/
    );
    expect(read('apps/api/tests/catalog-destination-wire-guard.test.ts')).toMatch(
      /catalog destination wire guard/
    );
  });
});

