import { describe, expect, it } from 'vitest';
import {
  mirrorCatalogDestinationIds,
  resolveStoredDestinationId,
} from '../src/lib/destination-id-sync.js';
import { testAreas } from './helpers/test-seed.js';

describe('destination-id-sync', () => {
  it('mirrorCatalogDestinationIds dual-writes matching ids', () => {
    const id = testAreas.hatta.id;
    expect(mirrorCatalogDestinationIds(id)).toEqual({
      areaId: id,
      destinationId: id,
    });
    expect(mirrorCatalogDestinationIds(null)).toEqual({ areaId: null, destinationId: null });
  });

  it('resolveStoredDestinationId prefers destinationId', () => {
    expect(resolveStoredDestinationId({ destinationId: 'd', areaId: 'a' })).toBe('d');
    expect(resolveStoredDestinationId({ areaId: 'a' })).toBe('a');
  });
});