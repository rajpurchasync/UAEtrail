import { describe, expect, it } from 'vitest';
import { seekingExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectSeekingActivitiesFromExploreCatalog } from './seeking';

describe('selectSeekingActivitiesFromExploreCatalog', () => {
  it('includes seeking activities when date chip is not applied (People Looking for)', () => {
    const farFuture = seekingExploreMapItem({
      id: 'activity:seek-future',
      date: '2099-06-15',
    });
    const rows = selectSeekingActivitiesFromExploreCatalog([farFuture], {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: '',
    });
    expect(rows).toHaveLength(1);
  });

  it('respects activity date preset when provided (Activities list)', () => {
    const farFuture = seekingExploreMapItem({
      id: 'activity:seek-future',
      date: '2099-06-15',
    });
    const rows = selectSeekingActivitiesFromExploreCatalog([farFuture], {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: '',
      activityDatePreset: 'today',
    });
    expect(rows).toHaveLength(0);
  });
});
