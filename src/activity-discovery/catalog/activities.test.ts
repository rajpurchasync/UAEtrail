import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, seekingExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectActivitiesFromExploreCatalog } from './activities';

const baseFilters = {
  mapFilter: 'all' as const,
  buddySubtype: 'all' as const,
  outingTopic: 'all' as const,
  query: '',
  activityDatePreset: 'anyday' as const,
};

describe('selectActivitiesFromExploreCatalog', () => {
  it('returns hosted activities when mode is hosted', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const seeking = seekingExploreMapItem({ id: 'activity:seek-1' });
    const result = selectActivitiesFromExploreCatalog([hosted, seeking], {
      ...baseFilters,
      activityModeFilter: 'hosted',
    });
    expect(result.map((i) => i.id)).toEqual(['activity:host-1']);
  });

  it('delegates to seeking selector when mode is seeking', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const seeking = seekingExploreMapItem({ id: 'activity:seek-1' });
    const result = selectActivitiesFromExploreCatalog([hosted, seeking], {
      ...baseFilters,
      activityModeFilter: 'seeking',
    });
    expect(result.map((i) => i.id)).toEqual(['activity:seek-1']);
  });
});
