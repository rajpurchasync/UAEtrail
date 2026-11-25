import { describe, expect, it } from 'vitest';
import {
  normalizeFacilityCatalogQuery,
  normalizePlaceCatalogQuery,
} from './catalog-query-normalize.js';

describe('catalog-query-normalize', () => {
  it('normalizePlaceCatalogQuery prefers destinationId over areaId', () => {
    expect(
      normalizePlaceCatalogQuery({
        destinationId: 'dest-a',
        areaId: 'legacy-b',
        segment: 'place',
      })
    ).toEqual({ destinationId: 'dest-a', segment: 'place' });
  });

  it('normalizePlaceCatalogQuery maps areaId when destinationId absent', () => {
    expect(normalizePlaceCatalogQuery({ areaId: 'area-seed-hatta' })).toEqual({
      destinationId: 'area-seed-hatta',
    });
  });

  it('normalizeFacilityCatalogQuery maps parentPlaceId to onSiteId', () => {
    expect(
      normalizeFacilityCatalogQuery({
        areaId: 'area-test-dubai',
        parentPlaceId: 'place-abc',
        facilityKind: 'toilet',
      })
    ).toEqual({
      destinationId: 'area-test-dubai',
      onSiteId: 'place-abc',
      facilityKind: 'toilet',
    });
  });

  it('normalizeFacilityCatalogQuery prefers canonical keys', () => {
    expect(
      normalizeFacilityCatalogQuery({
        destinationId: 'd1',
        onSiteId: 's1',
        areaId: 'legacy',
        parentPlaceId: 'legacy-site',
      })
    ).toEqual({ destinationId: 'd1', onSiteId: 's1' });
  });
});