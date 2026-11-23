import { describe, expect, it } from 'vitest';
import { availabilityExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectAvailabilityFromMapItems } from './availabilityCatalog';

describe('selectAvailabilityFromMapItems', () => {
  it('includes availability when date chip is not applied (People Looking for)', () => {
    const farFuture = availabilityExploreMapItem({
      id: 'availability:user-1:slot-future',
      date: '2099-06-15',
    });
    const rows = selectAvailabilityFromMapItems([farFuture], {
      mapFilter: 'all',
      othersSubtype: 'all',
      outingTopic: 'all',
      query: '',
    });
    expect(rows).toHaveLength(1);
  });

  it('respects activity date preset when provided (Activities list)', () => {
    const farFuture = availabilityExploreMapItem({
      id: 'availability:user-1:slot-future',
      date: '2099-06-15',
    });
    const rows = selectAvailabilityFromMapItems([farFuture], {
      mapFilter: 'all',
      othersSubtype: 'all',
      outingTopic: 'all',
      query: '',
      activityDatePreset: 'today',
    });
    expect(rows).toHaveLength(0);
  });
});