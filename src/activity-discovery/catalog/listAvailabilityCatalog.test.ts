import { describe, expect, it } from 'vitest';
import { availabilityExploreMapItem, hostedExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectAvailabilityForListCatalog } from './listAvailabilityCatalog';

describe('selectAvailabilityForListCatalog', () => {
  it('returns only seeking activities from the catalog slice', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:h1' });
    const availability = availabilityExploreMapItem({ id: 'availability:u1:slot-1' });
    const result = selectAvailabilityForListCatalog([hosted, availability]);
    expect(result.map((i) => i.id)).toEqual(['availability:u1:slot-1']);
  });
});
