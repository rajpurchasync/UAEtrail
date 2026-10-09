import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO, WishlistItemDTO } from '@uaetrail/shared-types';
import { planWishlistExploreMatches } from './planWishlistExploreMatches';

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
};

describe('planWishlistExploreMatches', () => {
  it('matches saved activity to explore map item', () => {
    const wishlist: WishlistItemDTO[] = [
      { id: 'w1', activityId: 'act-1', activity: { id: 'act-1', title: 'Sunrise hike', locationName: 'Hatta' } },
    ];
    const map: ExploreMapItemDTO[] = [
      {
        id: 'activity:act-1',
        kind: 'hiking',
        source: 'activity',
        title: 'Sunrise hike',
        latitude: 1,
        longitude: 2,
        path: '/activity/act-1',
        activity: {
          id: 'act-1',
          title: 'Sunrise hike',
          date: futureDate(),
          status: 'published',
          locationId: 'loc-1',
          locationName: 'Hatta',
          activityType: 'hiking',
          tenantId: 't1',
          hostUserId: 'h1',
          hostId: 'h1',
        } as never,
      },
    ];
    const matches = planWishlistExploreMatches(wishlist, map);
    expect(matches).toHaveLength(1);
    expect(matches[0].href).toBe('/activity/act-1');
  });

  it('skips activities the member already joined', () => {
    const wishlist: WishlistItemDTO[] = [{ id: 'w1', activityId: 'act-1' }];
    const map: ExploreMapItemDTO[] = [
      {
        id: 'activity:act-1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 1,
        longitude: 2,
        path: '/activity/act-1',
        activity: { id: 'act-1', date: futureDate(), status: 'published' } as never,
      },
    ];
    expect(planWishlistExploreMatches(wishlist, map, new Set(['act-1']))).toHaveLength(0);
  });
});
