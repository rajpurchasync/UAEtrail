import { describe, expect, it } from 'vitest';
import {
  mirrorCatalogOnSiteIds,
  resolveStoredOnSiteId,
} from '../src/lib/facility-on-site-sync.js';

describe('facility onSiteId sync (MIG-DESTINATION-GEO D0.5)', () => {
  it('mirrorCatalogOnSiteIds dual-writes matching ids', () => {
    expect(mirrorCatalogOnSiteIds('place-1')).toEqual({
      parentPlaceId: 'place-1',
      onSiteId: 'place-1',
    });
    expect(mirrorCatalogOnSiteIds(null)).toEqual({ parentPlaceId: null, onSiteId: null });
  });

  it('resolveStoredOnSiteId prefers onSiteId', () => {
    expect(resolveStoredOnSiteId({ onSiteId: 'a', parentPlaceId: 'b' })).toBe('a');
    expect(resolveStoredOnSiteId({ parentPlaceId: 'b' })).toBe('b');
  });
});