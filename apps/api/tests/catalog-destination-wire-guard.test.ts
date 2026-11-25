import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectTestFiles = (dir: string): string[] => {
  const root = join(ROOT, dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.test.ts')) files.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  };
  walk(root);
  return files;
};

/** MIG-DESTINATION-GEO Phase A — catalog seed helpers use `destinationId`, not `areaId`. */
describe('catalog destination wire guard', () => {
  it('public catalog registrars normalize inbound query at HTTP boundary', () => {
    const places = read('apps/api/src/routes/user/registerPublicPlaceRoutes.ts');
    const facilities = read('apps/api/src/routes/user/registerPublicFacilityRoutes.ts');
    expect(places).toMatch(/normalizePlaceCatalogQuery/);
    expect(facilities).toMatch(/normalizeFacilityCatalogQuery/);
    expect(facilities).not.toMatch(/filters\.areaId/);
    expect(facilities).not.toMatch(/destinationId \?\? filters\.areaId/);
  });

  it('shared-types exports catalog query normalizers', () => {
    const index = read('packages/shared-types/src/index.ts');
    expect(index).toMatch(/normalizePlaceCatalogQuery/);
    expect(index).toMatch(/normalizeFacilityCatalogQuery/);
    expect(read('packages/shared-types/src/catalog-query-normalize.ts')).not.toMatch(/areaId/);
  });

  it('explore catalog builder does not use retired catalogAreaLabel symbol', () => {
    const builder = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(builder).not.toMatch(/\bcatalogAreaLabel\b/);
    expect(builder).toMatch(/\bcatalogPlaceHubLabel\b/);
  });

  it('mongo geo search does not map curated destination slug to geo_nodes', () => {
    const geo = read('apps/api/src/lib/explore-geo-search.ts');
    expect(geo).toMatch(/mongoCatalogDestinationFilter/);
    expect(geo).not.toMatch(
      /resolveExploreDestinationSlugQuery\(query\)[\s\S]{0,120}kinds:\s*\['area',\s*'state'\]/
    );
    expect(geo).toMatch(/exploreMapItemMatchesDestinationSlug/);
    expect(geo).toMatch(/mongoActivityGeoSearchFilter/);
    expect(geo).toMatch(/locationId: \{ \$in:/);
  });

  it('hosted activities do not persist destinationId on create or publish', () => {
    const builders = read('apps/api/src/lib/entity-builders.ts');
    const publish = read('apps/api/src/lib/activities-store.ts');
    const createBlock = builders.match(/buildActivityFromCreateInput[\s\S]{0,2200}/);
    expect(createBlock?.[0]).toBeTruthy();
    expect(createBlock![0]).not.toMatch(/catalogDestinationIdUpdate\(data\.destinationId\)/);
    expect(publish).not.toMatch(/\?\s*\{\s*destinationId\s*\}/);
    expect(publish).not.toMatch(/destinationId && !draftDoc/);
  });

  it('API tests do not pass areaId into createLocationRecord / createFacilityRecord', () => {
    const violations: string[] = [];
    const pattern =
      /create(?:Location|Facility)Record\s*\(\s*\{[\s\S]{0,800}?\bareaId\s*:/;
    for (const file of collectTestFiles('apps/api/tests')) {
      if (file.endsWith('catalog-destination-wire-guard.test.ts')) continue;
      const src = read(file);
      if (pattern.test(src)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });
});