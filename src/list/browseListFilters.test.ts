import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { seekingExploreMapItem, hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { filterExploreMapItemsForList, type BrowseListFilterState } from './browseListFilters';

const baseState: BrowseListFilterState = {
  query: '',
  categories: ['activities'],
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'available',
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
      categories: ['activities'],
      tripTopics: ['hiking'],
      placeTopics: ['hiking'],
    };
    const filtered = filterExploreMapItemsForList(items, state, []);
    expect(filtered.some((i) => i.source === 'activity')).toBe(true);
    expect(filtered.every((i) => i.source === 'activity')).toBe(true);
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

  it('does not apply event when/date filters on the Places view', () => {
    const items = [hikingVenue('v1')];
    const filtered = filterExploreMapItemsForList(
      items,
      {
        ...baseState,
        categories: ['venues'],
        when: 'weekend',
        activityDatePreset: 'today',
      },
      []
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].source).toBe('venue');
  });

  it('tripLookingOnly uses activity-discovery seeking selector', () => {
    const items = [
      hostedExploreMapItem({ id: 'activity:host-1' }),
      seekingExploreMapItem({ id: 'activity:seek-1' }),
    ];
    const state: BrowseListFilterState = {
      ...baseState,
      tripLookingOnly: true,
    };
    const filtered = filterExploreMapItemsForList(items, state, []);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('activity:seek-1');
  });
});
