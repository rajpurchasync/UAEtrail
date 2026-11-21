import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  availabilityExploreMapItem,
  hostedExploreMapItem,
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

  it('maps leftover topic URL values', () => {
    expect(parseExploreMapFilterPillsParam('hiking,camping,shop')).toEqual(['trips', 'shops']);
  });

  it('classifies trips vs spots', () => {
    const trail = venueExploreMapItem({ id: 'venue:v1' });
    const hosted = hostedExploreMapItem({ id: 'activity:a1', kind: 'event' });
    const legacySeeking = seekingExploreMapItem({ intentId: 'x' });
    const fixedCrew = availabilityExploreMapItem({ userId: 'u1', slotId: 's1' });
    expect(mapItemMatchesFilterPill(trail, 'spots')).toBe(true);
    expect(mapItemMatchesFilterPill(hosted, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(legacySeeking, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(fixedCrew, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(legacySeeking, 'trips')).toBe(true);
  });

  it('parses leftover and new search scopes', () => {
    expect(parseExploreSearchScope('trips')).toBe('activities');
    expect(parseExploreSearchScope('spots')).toBe('places');
    expect(parseExploreSearchScope('people')).toBe('people');
    expect(parseExploreSearchScope('agencies')).toBe('agencies');
  });

  it('maps search scopes to item sources', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:a1', kind: 'event' });
    const seeking = seekingExploreMapItem({ intentId: 'd1' });
    const agencyTrip = hostedExploreMapItem({
      id: 'activity:a2',
      activity: { publishingProfileKind: 'agency', tenantSlug: 'uae-adventure' } as ExploreMapItemDTO['activity'],
    });
    expect(mapItemMatchesSearchScope(hosted, 'activities')).toBe(true);
    expect(mapItemMatchesSearchScope(seeking, 'people')).toBe(false);
    expect(pinKindForSearchScope('people')).toBe('all');
    expect(mapItemMatchesSearchScope(agencyTrip, 'agencies')).toBe(true);
  });
});
