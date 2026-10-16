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

  it('returns null without locationId', () => {
    expect(activityRegistryPlacePath({ locationId: '  ', activityType: 'hiking' })).toBeNull();
  });
});
