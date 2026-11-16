import { describe, expect, it } from 'vitest';
import { exploreMapItemPathFromAvailabilityRow } from './memberDiscoveryAvailabilityRow';

describe('memberDiscoveryAvailabilityRow routing', () => {
  it('opens people panel with availability pin', () => {
    expect(
      exploreMapItemPathFromAvailabilityRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        availabilityTitle: 'Hike crew',
        exploreItemId: 'availability:u1:slot-9',
      })
    ).toBe('/explore?list=1&panel=people&pin=availability%3Au1%3Aslot-9');
  });

  it('omits pin when exploreItemId is not availability-scoped', () => {
    expect(
      exploreMapItemPathFromAvailabilityRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        availabilityTitle: 'Camp',
        exploreItemId: 'activity:legacy',
      })
    ).toBe('/explore?list=1&panel=people');
  });
});