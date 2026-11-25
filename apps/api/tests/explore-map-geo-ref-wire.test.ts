import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('explore map geoRef wire', () => {
  it('catalog builder attaches geoRef and placeHubLabel on explore items', () => {
    const base = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(base).toMatch(/attachExploreItemPlaceHub/);
    expect(base).toMatch(/placeHubLabel: hubLabel/);
    expect(base).toMatch(/geoRef: item\.geoRef \?\? item\.activity\?\.geoRef/);
    expect(base).toMatch(/geoRef: dto\.geoRef/);
    expect(base).toMatch(/geoRef: facility\.geoRef/);
  });

  it('activity DTO inherits geoRef from linked location', () => {
    const mappers = read('apps/api/src/lib/mappers.ts');
    expect(mappers).toMatch(/locationGeoRef: event\.geoRef \?\? event\.location\.geoRef/);
    expect(mappers).toMatch(/geoRef: locationGeoRef \?\? event\.geoRef/);
    expect(mappers).toMatch(/geoRef: location\.geoRef/);
  });
});