import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  availabilityExploreMapItem,
  seekingExploreMapItem,
  hostedExploreMapItem,
} from '../explore/exploreMapItemFixtures';
import { filterExploreMapItemsForList, type BrowseListFilterState } from './browseListFilters';

const baseState: BrowseListFilterState = {
  query: '',
  categories: ['activities'],
  tripTopics: [],
  placeTopics: [],
  tripAvailabilityOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  peopleBrowseTab: 'available',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
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

  it('drops amenity POIs from the Venues list', () => {
    const toilet = {
      id: 'facility:toilet-1',
      kind: 'event',
      source: 'facility',
      placeKind: 'toilet',
      title: 'Hatta Dam visitor toilets',
      latitude: 25,
      longitude: 55,
      path: '/facility/toilet-1',
    } as ExploreMapItemDTO;
    const trail = hikingVenue('hatta-dam-loop');
    const filtered = filterExploreMapItemsForList(
      [toilet, trail],
      { ...baseState, categories: ['venues'] },
      []
    );
    expect(filtered.map((item) => item.id)).toEqual(['venue:hatta-dam-loop']);
  });

  it('By facilities keeps parent places with amenityKinds, not toilet cards', () => {
    const toilet = {
      id: 'facility:toilet-1',
      kind: 'event',
      source: 'facility',
      placeKind: 'toilet',
      title: 'Hatta Dam visitor toilets',
      latitude: 25,
      longitude: 55,
      path: '/facility/toilet-1',
    } as ExploreMapItemDTO;
    const trailWithToilet = {
      ...hikingVenue('hatta-dam-loop'),
      locationCard: { id: 'hatta-dam-loop', amenityKinds: ['toilet'], amenityLabels: ['Toilet'] },
    } as ExploreMapItemDTO;
    const trailWithout = hikingVenue('jebel-jais');
    const filtered = filterExploreMapItemsForList(
      [toilet, trailWithToilet, trailWithout],
      { ...baseState, categories: ['venues'], facilityKinds: ['toilet'] },
      []
    );
    expect(filtered.map((item) => item.id)).toEqual(['venue:hatta-dam-loop']);
  });

  it('tripAvailabilityOnly keeps member_availability catalog rows only', () => {
    const items = [
      hostedExploreMapItem({ id: 'activity:host-1' }),
      seekingExploreMapItem({ id: 'activity:seek-1' }),
      availabilityExploreMapItem({ userId: 'u1', slotId: 's1' }),
    ];
    const state: BrowseListFilterState = {
      ...baseState,
      tripAvailabilityOnly: true,
    };
    const filtered = filterExploreMapItemsForList(items, state, []);
    expect(filtered.map((item) => item.id)).toEqual([items[2]!.id]);
  });
});
