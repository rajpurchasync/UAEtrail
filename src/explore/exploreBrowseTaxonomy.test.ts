import { describe, expect, it } from 'vitest';
import {
  hostedExploreMapItem,
  legacyDemandExploreMapItem,
  seekingExploreMapItem,
  venueExploreMapItem,
} from './exploreMapItemFixtures';
import {
  mapItemMatchesFilterPill,
  mapItemMatchesSearchScope,
  parseExploreMapFilterPillsParam,
  parseExploreSearchScope,
  pinKindForSearchScope,
  toggleExploreMapFilterPill,
} from './exploreBrowseTaxonomy';

describe('exploreBrowseTaxonomy', () => {
  it('toggles filter pills', () => {
    expect(toggleExploreMapFilterPill([], 'trips')).toEqual(['trips']);
    expect(toggleExploreMapFilterPill(['trips'], 'trips')).toEqual([]);
  });

  it('maps legacy topic URL values', () => {
    expect(parseExploreMapFilterPillsParam('hiking,camping,shop')).toEqual(['trips', 'shops']);
  });

  it('classifies trips vs spots', () => {
    const trail = venueExploreMapItem({ id: 'venue:v1' });
    const hosted = hostedExploreMapItem({ id: 'activity:a1', kind: 'event' });
    const demand = legacyDemandExploreMapItem({ id: 'demand:d1' });
    const seeking = seekingExploreMapItem({ intentId: 'x' });
    expect(mapItemMatchesFilterPill(trail, 'spots')).toBe(true);
    expect(mapItemMatchesFilterPill(hosted, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(seeking, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(demand, 'looking')).toBe(true);
    expect(mapItemMatchesFilterPill(seeking, 'looking')).toBe(true);
    expect(mapItemMatchesFilterPill(hosted, 'looking')).toBe(false);
  });

  it('parses legacy and new search scopes', () => {
    expect(parseExploreSearchScope('trips')).toBe('activities');
    expect(parseExploreSearchScope('spots')).toBe('places');
    expect(parseExploreSearchScope('people')).toBe('people');
    expect(parseExploreSearchScope('agencies')).toBe('agencies');
  });

  it('maps search scopes to item sources', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:a1', kind: 'event' });
    const demand = legacyDemandExploreMapItem({ id: 'demand:d1' });
    const agency = venueExploreMapItem({
      id: 'agency:g1',
      source: 'agency',
      kind: 'agency',
      path: '/agency/g1',
    });
    expect(mapItemMatchesSearchScope(hosted, 'activities')).toBe(true);
    expect(mapItemMatchesSearchScope(demand, 'people')).toBe(false);
    expect(pinKindForSearchScope('people')).toBe('all');
    expect(mapItemMatchesSearchScope(agency, 'agencies')).toBe(true);
  });

});
