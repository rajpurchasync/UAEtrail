import { describe, expect, it } from 'vitest';
import type { WishlistItemDTO } from '@uaetrail/shared-types';
import { countPlanSavedPlaces } from './planHubSummaryCounts';

describe('planHubSummaryCounts', () => {
  it('counts catalog venue rows only', () => {
    const items: WishlistItemDTO[] = [
      { id: '1', locationId: 'loc-1' },
      { id: '2', activityId: 'act-1' },
      {
        id: '3',
        locationId: 'loc-2',
        location: { id: 'loc-2', name: 'X', images: [], activityType: 'HIKING' },
      },
    ];
    expect(countPlanSavedPlaces(items)).toBe(2);
  });
});
