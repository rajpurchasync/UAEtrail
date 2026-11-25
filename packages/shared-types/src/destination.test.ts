import { describe, expect, it } from 'vitest';
import {
  catalogDestinationIdUpdate,
  destinationHubPath,
  exploreDestinationQueryParam,
  exploreMapItemMatchesDestinationSlug,
  filterExploreMapItemsByDestinationSlug,
  resolveDestinationId,
  resolveExploreDestinationSlugQuery,
} from './destination.js';

describe('destination wire', () => {
  it('destinationHubPath encodes slug', () => {
    expect(destinationHubPath('hatta')).toBe('/destination/hatta');
    expect(destinationHubPath('wadi shawka')).toBe('/destination/wadi%20shawka');
  });

  it('resolveDestinationId reads destinationId only', () => {
    expect(resolveDestinationId({ destinationId: 'd1' })).toBe('d1');
    expect(resolveDestinationId({ destinationId: '  ' })).toBeNull();
    expect(resolveDestinationId(null)).toBeNull();
  });

  it('catalogDestinationIdUpdate writes destinationId only', () => {
    const id = 'area-seed-hatta';
    expect(catalogDestinationIdUpdate(id)).toEqual({ destinationId: id });
    expect(catalogDestinationIdUpdate(null)).toEqual({ destinationId: null });
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
    expect(exploreMapItemMatchesDestinationSlug({ destinationSlug: 'hatta' }, 'hatta')).toBe(true);
    expect(exploreMapItemMatchesDestinationSlug({ destinationSlug: 'other' }, 'hatta')).toBe(false);
  });
});