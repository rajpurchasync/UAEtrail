import { describe, expect, it } from 'vitest';
import { buildExploreCardModel, resolveExploreWishlistTarget } from './exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

const baseItem = (overrides: Partial<ExploreMapItemDTO>): ExploreMapItemDTO =>
  ({
    id: 'activity:1',
    kind: 'hiking',
    source: 'activity',
    title: 'Test',
    path: '/activity/1',
    latitude: 25,
    longitude: 55,
    composeIntent: 'organize',
    outingCategory: 'hiking',
    activity: {
      id: '1',
      title: 'Hike',
      activityType: 'hiking',
    } as ExploreMapItemDTO['activity'],
    ...overrides,
  }) as ExploreMapItemDTO;

describe('resolveExploreWishlistTarget', () => {
  it('includes activity id and watch metadata for organize pins', () => {
    const card = buildExploreCardModel(baseItem({}));
    const target = resolveExploreWishlistTarget(card);
    expect(target?.activityId).toBe('1');
    expect(target?.watchOutingCategory).toBe('hiking');
    expect(target?.watchLatitude).toBe(25);
  });

  it('does not wishlist-save demand pins (participation is on Explore)', () => {
    const card = buildExploreCardModel(
      baseItem({
        id: 'demand:int-1',
        kind: 'event',
        source: 'demand',
        composeIntent: 'demand',
        outingCategory: 'hiking',
        activity: undefined,
        participantIntentId: 'int-1',
      })
    );
    expect(resolveExploreWishlistTarget(card)).toBeNull();
  });
});
