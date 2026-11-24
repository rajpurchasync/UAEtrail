import { describe, expect, it } from 'vitest';
import {
  destinationHubPath,
  exploreDestinationQueryParam,
  exploreMapItemMatchesDestinationSlug,
  filterExploreMapItemsByDestinationSlug,
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

  it('filterExploreMapItemsByDestinationSlug matches destinationSlug or legacy areaSlug', () => {
    const inHatta = { destinationSlug: 'hatta', areaSlug: 'legacy' };
    const byArea = { destinationSlug: null, areaSlug: 'hatta' };
    const other = { destinationSlug: 'jebel-jais' };
    expect(filterExploreMapItemsByDestinationSlug([inHatta, byArea, other], 'hatta')).toHaveLength(2);
    expect(exploreMapItemMatchesDestinationSlug({ source: 'area', id: 'area:hatta' }, 'hatta')).toBe(
      true
    );
  });
});