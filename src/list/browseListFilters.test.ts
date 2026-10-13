import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { filterExploreMapItemsForList, type BrowseListFilterState } from './browseListFilters';

const baseState: BrowseListFilterState = {
  query: '',
  categories: ['trips'],
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'going',
};

const hikingActivity = (id: string): ExploreMapItemDTO =>
  ({
    id: `activity:${id}`,
    kind: 'hiking',
    source: 'activity',
    title: 'Hike',
    latitude: 25,
    longitude: 55,
    path: `/activity/${id}`,
    presentation: { kind: 'hiking', source: 'activity', emoji: '🥾', headline: 'Hike' },
  }) as ExploreMapItemDTO;

const hikingVenue = (id: string): ExploreMapItemDTO =>
  ({
    id: `venue:${id}`,
    kind: 'hiking',
    source: 'venue',
    title: 'Trail',
    latitude: 25,
    longitude: 55,
    path: `/trail/${id}`,
    presentation: { kind: 'hiking', source: 'venue', emoji: '🥾', headline: 'Trail' },
  }) as ExploreMapItemDTO;

describe('filterExploreMapItemsForList', () => {
  it('keeps hiking activities on Trips category when filter=hiking (no place-topic bleed)', () => {
    const items = [hikingActivity('a1'), hikingVenue('v1')];
    const state: BrowseListFilterState = {
      ...baseState,
      categories: ['trips'],
      tripTopics: ['hiking'],
      placeTopics: ['hiking'],
    };
    const filtered = filterExploreMapItemsForList(items, state, []);
    expect(filtered.some((i) => i.source === 'activity')).toBe(true);
    expect(filtered.every((i) => i.source === 'activity' || i.source === 'demand')).toBe(true);
  });

  it('filters venues by place topics on Places category only', () => {
    const items = [hikingActivity('a1'), hikingVenue('v1')];
    const state: BrowseListFilterState = {
      ...baseState,
      categories: ['venues'],
      tripTopics: [],
      placeTopics: ['hiking'],
    };
    const filtered = filterExploreMapItemsForList(items, state, []);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].source).toBe('venue');
  });
});
