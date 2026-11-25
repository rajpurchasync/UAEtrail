import { describe, expect, it } from 'vitest';
import {
  normalizeFacilityCatalogQuery,
  normalizePlaceCatalogQuery,
} from './catalog-query-normalize.js';

describe('catalog-query-normalize', () => {
  it('normalizePlaceCatalogQuery trims destinationId', () => {
    expect(
      normalizePlaceCatalogQuery({
        destinationId: '  dest-a ',
        segment: 'place',
      })
    ).toEqual({ destinationId: 'dest-a', segment: 'place' });
  });

  it('normalizeFacilityCatalogQuery trims destinationId and onSiteId', () => {
    expect(
      normalizeFacilityCatalogQuery({
        destinationId: 'd1',
        onSiteId: 's1',
        facilityKind: 'toilet',
      })
    ).toEqual({
      destinationId: 'd1',
      onSiteId: 's1',
      facilityKind: 'toilet',
    });
  });

  it('normalizeFacilityCatalogQuery nullifies blank onSiteId', () => {
    expect(
      normalizeFacilityCatalogQuery({
        onSiteId: '  ',
      })
    ).toEqual({ onSiteId: null });
  });
});