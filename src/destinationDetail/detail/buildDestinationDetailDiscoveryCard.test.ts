import { describe, expect, it } from 'vitest';
import { resolveExploreWishlistTarget } from '../../discovery/discoveryCardModel';
import { buildDestinationDetailDiscoveryCard } from './buildDestinationDetailDiscoveryCard';

const sampleArea = {
  id: 'area-test-hatta',
  slug: 'hatta',
  name: 'Hatta',
  region: 'Dubai',
  center: { latitude: 24.82, longitude: 56.13 },
  bounds: [
    { latitude: 24.9, longitude: 56.0 },
    { latitude: 24.9, longitude: 56.2 },
    { latitude: 24.7, longitude: 56.2 },
  ],
  priority: 1,
};

describe('buildDestinationDetailDiscoveryCard', () => {
  it('resolves area wishlist target for trip alerts', () => {
    const card = buildDestinationDetailDiscoveryCard({
      area: sampleArea,
      shareText: 'Outings in Hatta',
    });
    expect(card.source).toBe('area');
    expect(card.destinationId).toBe(sampleArea.id);
    expect(resolveExploreWishlistTarget(card)).toEqual({
      destinationId: sampleArea.id,
      alertOnMatch: true,
      watchOutingCategory: null,
      watchLatitude: sampleArea.center.latitude,
      watchLongitude: sampleArea.center.longitude,
    });
  });
});
