import { describe, expect, it } from 'vitest';
import { resolveExploreWishlistTarget } from '../../discovery/discoveryCardModel';
import type { Place } from '../../types/place';
import { buildPlaceDetailDiscoveryCard } from './buildPlaceDetailDiscoveryCard';

const basePlace = (): Place =>
  ({
    id: 'p1',
    name: 'Test Trail',
    region: 'Dubai',
    activityType: 'hiking',
    description: 'A trail',
    images: [],
    featured: false,
    latitude: 25.1,
    longitude: 55.2,
  }) as Place;

describe('buildPlaceDetailDiscoveryCard', () => {
  it('resolves location wishlist target for trip alerts', () => {
    const card = buildPlaceDetailDiscoveryCard({
      kind: 'trail',
      place: basePlace(),
      placeId: 'p1',
      detailPath: '/trail/p1',
      shareText: 'Share',
    });
    expect(card.locationId).toBe('p1');
    expect(resolveExploreWishlistTarget(card)).toEqual(
      expect.objectContaining({ locationId: 'p1', watchLatitude: 25.1, watchLongitude: 55.2 })
    );
  });
});
