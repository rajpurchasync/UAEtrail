import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('data source coherence guard', () => {
  it('explore map catalog does not overlay venue JSON onto Mongo rows at read time', () => {
    const builder = read('src/lib/discovery-catalog-builder.ts');
    expect(builder).not.toMatch(/overlayCatalogDefaultsOnLocation/);
    expect(builder).not.toMatch(/isVenueCatalogRuntimeOverlayEnabled/);
    expect(read('src/lib/venue-catalog.ts')).toMatch(/Explore map catalog reads Mongo only/);
  });

  it('marketing review highlights route is public', () => {
    const routes = read('src/routes/user/registerReviewRoutes.ts');
    expect(routes).toMatch(/marketing-highlights/);
  });

  it('guest map route applies server catalog cap when enabled', () => {
    const route = read('src/lib/explore-map-route.ts');
    expect(route).toMatch(/applyGuestExploreMapCatalogCap/);
    expect(route).toMatch(/isGuestExploreMapCatalogCapEnabled/);
  });

  it('submission area materialize does not re-seed curated geo catalog', () => {
    const submissions = read('src/lib/submissions-store.ts');
    expect(submissions).not.toMatch(/seedGeoNodesFromCatalog/);
  });

  it('catalog reads do not auto-insert DEFAULTS in production', () => {
    const store = read('src/lib/catalogs-store.ts');
    expect(store).toMatch(/allowRuntimeCatalogSeed/);
    expect(store).toMatch(/NODE_ENV !== 'production'/);
  });

  it('DMCP-2: product map catalog skips seeking activities and availability only pins', () => {
    const builder = read('src/lib/discovery-catalog-builder.ts');
    expect(builder).toMatch(/isRetiredSeekingActivityMode\(event\.activityMode\)\) continue/);
    expect(builder).toMatch(/buildAvailabilityFixedMapItems/);
    expect(builder).not.toMatch(/listActiveParticipantIntentsForMap/);
  });
});