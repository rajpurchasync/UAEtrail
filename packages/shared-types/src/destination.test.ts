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

  it('resolveDestinationId reads destinationId only', () => {
    expect(resolveDestinationId({ destinationId: 'd1' })).toBe('d1');
    expect(resolveDestinationId({ destinationId: '  ' })).toBeNull();
    expect(resolveDestinationId(null)).toBeNull();
  });

  it('exploreDestinationQueryParam is stable', () => {
    expect(exploreDestinationQueryParam).toBe('destination');
  });

  it('resolveExploreDestinationSlugQuery uses destination param only', () => {
    expect(resolveExploreDestinationSlugQuery({ destination: 'Hatta' })).toBe('hatta');
    expect(resolveExploreDestinationSlugQuery({})).toBeNull();
  });

  it('filterExploreMapItemsByDestinationSlug matches destinationSlug', () => {
    const inHatta = { destinationSlug: 'hatta' };
    const other = { destinationSlug: 'jebel-jais' };
    expect(filterExploreMapItemsByDestinationSlug([inHatta, other], 'hatta')).toHaveLength(1);
    expect(exploreMapItemMatchesDestinationSlug({ source: 'area', id: 'area:hatta' }, 'hatta')).toBe(
      true
    );
  });
});