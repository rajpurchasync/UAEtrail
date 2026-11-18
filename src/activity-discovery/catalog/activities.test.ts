import { describe, expect, it } from 'vitest';
import {
  availabilityExploreMapItem,
  hostedExploreMapItem,
  seekingExploreMapItem,
} from '../../explore/exploreMapItemFixtures';
import { selectActivitiesFromMapItems } from './activities';

const baseFilters = {
  mapFilter: 'all' as const,
  buddySubtype: 'all' as const,
  outingTopic: 'all' as const,
  query: '',
  activityDatePreset: 'anyday' as const,
};

describe('selectActivitiesFromMapItems', () => {
  it('returns hosted activities when mode is hosted', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const seeking = seekingExploreMapItem({ id: 'activity:seek-1' });
    const result = selectActivitiesFromMapItems([hosted, seeking], {
      ...baseFilters,
      activityModeFilter: 'hosted',
    });
    expect(result.map((i) => i.id)).toEqual(['activity:host-1']);
  });

  it('returns fixed availability when mode filter is seeking (legacy param)', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const availability = availabilityExploreMapItem({ userId: 'u1', slotId: 's1' });
    const seeking = seekingExploreMapItem({ id: 'activity:seek-1' });
    const result = selectActivitiesFromMapItems([hosted, seeking, availability], {
      ...baseFilters,
      activityModeFilter: 'seeking',
    });
    expect(result.map((i) => i.id)).toEqual([availability.id]);
  });

  it('excludes legacy seeking activities from the default trips map pool', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:host-1' });
    const seeking = seekingExploreMapItem({ id: 'activity:seek-1' });
    const availability = availabilityExploreMapItem();
    const result = selectActivitiesFromMapItems([hosted, seeking, availability], baseFilters);
    expect(result.map((i) => i.id).sort()).toEqual([availability.id, 'activity:host-1'].sort());
  });
});