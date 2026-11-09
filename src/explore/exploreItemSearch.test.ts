import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreItemMatchesQuery } from './exploreItemSearch';

const baseActivity = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO => ({
  id: 'activity:1',
  kind: 'hiking',
  source: 'activity',
  title: 'Jebel Jais Group Hike',
  subtitle: 'Jebel Jais',
  latitude: 25.9,
  longitude: 56.1,
  path: '/activity/1',
  activity: {
    id: '1',
    tenantId: 't',
    tenantSlug: 'host',
    locationId: 'loc',
    locationName: 'Jebel Jais',
    region: 'RAK',
    activityType: 'hiking',
    title: 'Jebel Jais Group Hike',
    description: 'Sunrise ridge walk with a friendly crew.',
    date: '2026-10-01',
    time: '06:00',
    price: 0,
    slotsTotal: 10,
    slotsAvailable: 5,
    status: 'published',
    hostName: 'Sara',
  },
  ...overrides,
});

describe('exploreItemMatchesQuery', () => {
  it('matches emirate via activity.region when subtitle is only the trail', () => {
    const item = baseActivity();
    expect(exploreItemMatchesQuery(item, 'ras al khaimah')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'rask al khaimah')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'rak')).toBe(true);
  });

  it('matches category and filter vocabulary', () => {
    const item = baseActivity();
    expect(exploreItemMatchesQuery(item, 'hiking')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'hike')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'trips')).toBe(true);
  });

  it('matches activity description and host', () => {
    const item = baseActivity();
    expect(exploreItemMatchesQuery(item, 'sunrise ridge')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'sara')).toBe(true);
  });

  it('matches venue region on location card', () => {
    const item: ExploreMapItemDTO = {
      id: 'venue:1',
      kind: 'hiking',
      source: 'venue',
      title: 'Wadi Ghalilah',
      subtitle: 'Ras Al Khaimah',
      latitude: 25.9,
      longitude: 56.1,
      path: '/trail/1',
      locationCard: {
        id: '1',
        activityType: 'hiking',
        region: 'RAK',
        description: 'Steep trail with views',
        childFriendly: false,
        season: ['winter'],
        images: [],
        featured: false,
      },
    };
    expect(exploreItemMatchesQuery(item, 'fujairah')).toBe(false);
    expect(exploreItemMatchesQuery(item, 'trails')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'spots')).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(exploreItemMatchesQuery(baseActivity(), '')).toBe(true);
    expect(exploreItemMatchesQuery(baseActivity(), '   ')).toBe(true);
  });

  it('matches country, area, and venue names on geoRef', () => {
    const item = baseActivity({
      geoRef: {
        chain: ['geo-country-ae', 'geo-state-ae-dubai'],
        countryId: 'geo-country-ae',
        stateId: 'geo-state-ae-dubai',
        areaId: 'geo-area-other-geo-state-ae-dubai',
        path: 'ae/dubai/hatnub',
        names: {
          country: 'United Arab Emirates',
          state: 'Dubai',
          area: 'Hatta',
          venue: 'Hatnub Ridge',
        },
        searchTokens: ['united arab emirates', 'dubai', 'hatta', 'hatnub', 'ridge'],
      },
    });
    expect(exploreItemMatchesQuery(item, 'united arab emirates')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'hatta')).toBe(true);
    expect(exploreItemMatchesQuery(item, 'hatnub ridge')).toBe(true);
  });
});
