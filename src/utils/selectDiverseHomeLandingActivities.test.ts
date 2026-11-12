import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { selectDiverseHomeLandingActivities } from './selectDiverseHomeLandingActivities';

const row = (
  id: string,
  activityType: ActivityDTO['activityType'],
  locationId: string,
  date = '2026-11-20'
): ActivityDTO =>
  ({
    id,
    title: id,
    activityType,
    locationId,
    locationName: locationId,
    date,
    time: '07:00',
    region: 'Dubai',
    price: 0,
  }) as ActivityDTO;

describe('selectDiverseHomeLandingActivities', () => {
  it('caps at 8 and spreads types and places', () => {
    const pool = [
      row('h1', 'hiking', 'place-a'),
      row('h2', 'hiking', 'place-a'),
      row('h3', 'hiking', 'place-b'),
      row('c1', 'camping', 'place-c'),
      row('c2', 'camping', 'place-c'),
      row('e1', 'event', 'place-d'),
      row('e2', 'event', 'place-e'),
      row('r1', 'rideshare', 'place-f'),
      row('r2', 'rideshare', 'place-g'),
      row('h4', 'hiking', 'place-h'),
    ];
    const selected = selectDiverseHomeLandingActivities(pool, 8);
    expect(selected).toHaveLength(8);
    const types = new Set(selected.map((item) => item.activityType));
    expect(types.size).toBeGreaterThanOrEqual(3);
    const places = new Set(selected.map((item) => item.locationId));
    expect(places.size).toBeGreaterThanOrEqual(6);
  });

  it('returns the full pool when smaller than the limit', () => {
    const pool = [row('a', 'hiking', 'p1'), row('b', 'camping', 'p2')];
    expect(selectDiverseHomeLandingActivities(pool, 8)).toHaveLength(2);
  });
});
