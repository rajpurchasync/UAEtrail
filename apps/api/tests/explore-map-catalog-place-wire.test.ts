import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('explore map place + facility wire (COH-02)', () => {
  it('map builder emits place and facility sources (not venue / catalog_place)', () => {
    const base = read('apps/api/src/lib/explore-map-base.ts');
    expect(base).toMatch(/PLACE_MAP_SOURCE/);
    expect(base).toMatch(/FACILITY_MAP_SOURCE/);
    expect(base).not.toMatch(/source: 'venue'/);
    expect(base).not.toMatch(/source: 'catalog_place'/);
    expect(base).not.toMatch(/buildExploreAreaLensItems/);
    expect(base).toMatch(/id: `facility:\$\{facility\.id\}`/);
    expect(base).toMatch(/resolveLocationAmenities/);
    expect(base).toMatch(/collectParentPlaceAmenities/);
  });
});
