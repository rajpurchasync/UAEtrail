import { describe, expect, it } from 'vitest';
import {
  availabilityExploreMapItem,
  hostedExploreMapItem,
  excludedSeekingActivityMapItem,
} from '../../explore/exploreMapItemFixtures';
import {
  filterListAvailabilityCatalogItems,
  selectAvailabilityForListCatalog,
} from './listAvailabilityCatalog';

describe('listAvailabilityCatalog', () => {
  it('selectAvailabilityForListCatalog returns only availability pins', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:h1' });
    const availability = availabilityExploreMapItem({ id: 'availability:u1:slot-1' });
    const result = selectAvailabilityForListCatalog([hosted, availability]);
    expect(result.map((i) => i.id)).toEqual(['availability:u1:slot-1']);
  });

  it('filterListAvailabilityCatalogItems excludes legacy seeking activities', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const legacy = excludedSeekingActivityMapItem({ id: 'activity:seek-1' });
    const fixed = availabilityExploreMapItem({ userId: 'u1', slotId: 's1' });
    expect(filterListAvailabilityCatalogItems([hosted, legacy, fixed]).map((i) => i.id)).toEqual([
      fixed.id,
    ]);
  });
});