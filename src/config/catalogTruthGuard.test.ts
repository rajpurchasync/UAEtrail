import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('catalogTruthGuard (DMCP Phase 2 · MIG-DISCO-REG)', () => {
  it('CAT-02-01: sole map catalog builder path (no dual payloads)', () => {
    const exploreMap = read('apps/api/src/lib/explore-map.ts');
    expect(exploreMap).toMatch(/buildDiscoveryCatalogMapPayload/);
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap/);
    const builder = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(builder).toMatch(/buildAvailabilityFixedMapItems/);
    expect(builder).toMatch(/activityMode === 'seeking'\) continue/);
    expect(builder).not.toMatch(/source:\s*'demand'/);
  });

  it('CAT-02-02: Find crew writes use PUT /me/availability only', () => {
    const store = read('apps/api/src/lib/participant-intents-store.ts');
    expect(store).toMatch(/backfillSeekingActivitiesForActiveIntents/);
    expect(store).not.toMatch(/createParticipantIntent/);
    const composer = read('apps/api/src/routes/user/composeUserMemberRoutes.ts');
    expect(composer).toMatch(/registerMeAvailabilityRoutes/);
    expect(composer).not.toMatch(/registerMeSeekingPostRoutes|registerMeParticipantIntentRoutes/);
  });

  it('CAT-02-03: FE uses single explore map client (no parallel catalog fetch)', () => {
    const client = read('src/hooks/exploreMapClientApi.ts');
    const exploreDomain = read('src/api/domains/explore.ts');
    expect(client).toMatch(/fetchExploreMapItems/);
    expect(client).toMatch(/exploreMapHttpPath/);
    expect(exploreDomain).toMatch(/\/explore\/map/);
    expect(client).not.toMatch(/\/explore\/seeking-activities/);
    expect(existsSync(join(process.cwd(), 'src/list/listDemandCatalog.ts'))).toBe(false);
    const runtime = read('src/explore/discoveryRuntime.ts');
    expect(runtime).toMatch(/fetchExploreMapItems/);
  });

  it('CAT-02-04: authority matrix names availability for find crew', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    const ids = new Set((matrix.actions ?? []).map((a: { id: string }) => a.id));
    expect(ids.has('availability.write_open')).toBe(true);
    expect(ids.has('availability.map_pin')).toBe(true);
    expect(ids.has('discover.map_catalog')).toBe(true);
    expect(ids.has('discover.catalog_assembler')).toBe(true);
    const legacy = (matrix.actions ?? []).find((a: { id: string }) => a.id === 'legacy.seeking_map_product');
    expect(legacy?.retired).toBe(true);
  });

  it('CAT-02-05: verify:catalog-truth wired in package scripts', () => {
    expect(read('package.json')).toMatch(/verify:catalog-truth/);
    expect(existsSync(join(process.cwd(), 'scripts/verify-catalog-truth.mjs'))).toBe(true);
  });
});