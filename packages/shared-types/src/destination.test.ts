import { describe, expect, it } from 'vitest';
import {
  destinationHubPath,
  exploreDestinationQueryParam,
  resolveDestinationId,
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
});