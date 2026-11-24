import { describe, expect, it } from 'vitest';
import {
  destinationHubPath,
  exploreDestinationQueryParam,
  resolveDestinationId,
  resolveExploreDestinationSlugQuery,
} from './destination.js';

describe('destination wire (MIG-DESTINATION-GEO)', () => {
  it('destinationHubPath encodes slug', () => {
    expect(destinationHubPath('hatta')).toBe('/destination/hatta');
    expect(destinationHubPath('wadi shawka')).toBe('/destination/wadi%20shawka');
  });

  it('resolveDestinationId prefers destinationId over areaId', () => {
    expect(resolveDestinationId({ destinationId: 'd1', areaId: 'a1' })).toBe('d1');
    expect(resolveDestinationId({ areaId: 'area-seed-hatta' })).toBe('area-seed-hatta');
    expect(resolveDestinationId({ destinationId: '  ' })).toBeNull();
    expect(resolveDestinationId(null)).toBeNull();
  });

  it('exploreDestinationQueryParam is stable', () => {
    expect(exploreDestinationQueryParam).toBe('destination');
  });

  it('resolveExploreDestinationSlugQuery prefers destination', () => {
    expect(resolveExploreDestinationSlugQuery({ destination: 'Hatta', area: 'other' })).toBe('hatta');
    expect(resolveExploreDestinationSlugQuery({ area: 'hatta' })).toBe('hatta');
    expect(resolveExploreDestinationSlugQuery({})).toBeNull();
  });
});