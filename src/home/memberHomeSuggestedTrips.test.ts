import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildMemberHomePlannedTripPool,
  isMemberHomePlannedTripItem,
} from './memberHomeSuggestedTrips';

const activity = (overrides: Partial<ExploreMapItemDTO> & { id: string }): ExploreMapItemDTO =>
  ({
    kind: 'hiking',
    source: 'activity',
    title: 'Hike',
    path: '/activity/a',
    activityMode: 'hosted',
    latitude: 25.2,
    longitude: 55.27,
    ...overrides,
  }) as ExploreMapItemDTO;

describe('memberHomeSuggestedTrips', () => {
  it('keeps hosted activities and drops crew / rideshare pins', () => {
    expect(isMemberHomePlannedTripItem(activity({ id: 'a' }))).toBe(true);
    expect(isMemberHomePlannedTripItem(activity({ id: 'b', source: 'availability' }))).toBe(false);
    expect(isMemberHomePlannedTripItem(activity({ id: 'c', kind: 'rideshare' }))).toBe(false);
  });

  it('sorts by distance first and uses recommendations as tie-breakers', () => {
    const catalog = [
      activity({ id: 'near', latitude: 25.21, longitude: 55.28 }),
      activity({ id: 'far', latitude: 25.9, longitude: 56.0 }),
      activity({ id: 'boost', latitude: 25.5, longitude: 55.5 }),
    ];
    const pool = buildMemberHomePlannedTripPool(catalog, ['boost', 'missing'], {
      lat: 25.2,
      lng: 55.27,
    });
    expect(pool.map((row) => row.id)).toEqual(['near', 'boost', 'far']);
  });
});