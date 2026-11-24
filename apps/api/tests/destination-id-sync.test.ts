import { describe, expect, it } from 'vitest';
import {
  catalogDestinationIdUpdate,
  resolveStoredDestinationId,
} from '../src/lib/destination-id-sync.js';
import { testAreas } from './helpers/test-seed.js';

describe('destination-id-sync', () => {
  it('catalogDestinationIdUpdate writes destinationId only', () => {
    const id = testAreas.hatta.id;
    expect(catalogDestinationIdUpdate(id)).toEqual({ destinationId: id });
    expect(catalogDestinationIdUpdate(null)).toEqual({ destinationId: null });
  });

  it('resolveStoredDestinationId reads destinationId only', () => {
    expect(resolveStoredDestinationId({ destinationId: 'd' })).toBe('d');
    expect(resolveStoredDestinationId({})).toBeNull();
  });
});