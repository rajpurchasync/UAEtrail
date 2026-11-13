import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('geo catalog pagination', () => {
  it('sends cursor and limit on geo list APIs', () => {
    const client = read('src/api/domains/geoHierarchy.ts');
    expect(client).toMatch(/GEO_CATALOG_PAGE_SIZE = 20/);
    expect(client).toMatch(/search.set\('cursor'/);
    expect(client).toMatch(/search.set\('limit'/);
    expect(read('apps/api/src/routes/user/registerPublicGeoHierarchyRoutes.ts')).toMatch(
      /limit: z.coerce.number/
    );
    expect(read('apps/api/src/lib/geo-read.ts')).toMatch(/geoListPageSize/);
  });

  it('does not prefetch full place/activity catalogs on geo pages', () => {
    expect(read('src/pages/GeoNodePage.tsx')).not.toMatch(/fetchGeoPlaces|fetchGeoActivities/);
    expect(read('src/pages/GeoTreePage.tsx')).not.toMatch(/fetchGeoPlaces|fetchGeoActivities/);
    expect(read('src/geo/GeoHubView.tsx')).toMatch(/useGeoPagedPlaces/);
    expect(read('src/geo/GeoHubView.tsx')).toMatch(/GeoBrowsePane/);
    expect(read('src/geo/GeoHubView.tsx')).not.toMatch(/Places, events & spots/);
  });
});
