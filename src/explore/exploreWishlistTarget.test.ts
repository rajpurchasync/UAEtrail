import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { resolveExploreWishlistTarget } from './exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { seekingExploreMapItem } from './exploreMapItemFixtures';

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
    const card = buildDiscoveryCardViewModelCard(baseItem({}));
    const target = resolveExploreWishlistTarget(card);
    expect(target?.activityId).toBe('1');
    expect(target?.watchOutingCategory).toBe('hiking');
    expect(target?.watchLatitude).toBe(25);
  });

  it('does not wishlist-save demand pins (participation is on Explore)', () => {
    const card = buildDiscoveryCardViewModelCard(
      seekingExploreMapItem({
        kind: 'event',
        outingCategory: 'hiking',
        activity: undefined,
        intentId: 'int-1',
      })
    );
    expect(resolveExploreWishlistTarget(card)).toBeNull();
  });
});
