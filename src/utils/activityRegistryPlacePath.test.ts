import { describe, expect, it } from 'vitest';
import { activityRegistryPlacePath } from './activityRegistryPlacePath';

describe('activityRegistryPlacePath', () => {
  it('returns trail path for hiking activity with locationId', () => {
    expect(
      activityRegistryPlacePath({
        locationId: 'loc-1',
        activityType: 'hiking',
        location: { activityType: 'hiking' } as never,
      })
    ).toBe('/place/loc-1');
  });

  it('uses linked place type for carpool', () => {
    expect(
      activityRegistryPlacePath({
        locationId: 'loc-2',
        activityType: 'rideshare',
        location: { activityType: 'hiking' } as never,
      })
    ).toBe('/place/loc-2');
  });

  it('does not open /venue when an event outing is at a camping place', () => {
    expect(
      activityRegistryPlacePath({
        locationId: 'fossil-rock-desert-camp',
        activityType: 'event',
        location: { activityType: 'camping' } as never,
      })
    ).toBe('/place/fossil-rock-desert-camp');
  });

  it('falls back to canonical /place when place type is unknown', () => {
    expect(
      activityRegistryPlacePath({
        locationId: 'fossil-rock-desert-camp',
        activityType: 'event',
      })
    ).toBe('/place/fossil-rock-desert-camp');
  });

  it('returns null without locationId', () => {
    expect(activityRegistryPlacePath({ locationId: '  ', activityType: 'hiking' })).toBeNull();
  });
});
