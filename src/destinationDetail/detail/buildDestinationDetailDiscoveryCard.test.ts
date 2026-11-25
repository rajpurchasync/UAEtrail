import { describe, expect, it } from 'vitest';
import { resolveExploreWishlistTarget } from '../../discovery/discoveryCardModel';
import { buildDestinationDetailDiscoveryCard } from './buildDestinationDetailDiscoveryCard';

const sampleDestination = {
  id: 'area-seed-hatta',
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
  it('resolves destination wishlist target for trip alerts', () => {
    const card = buildDestinationDetailDiscoveryCard({
      destination: sampleDestination,
      shareText: 'Outings in Hatta',
    });
    expect(card.kind).toBe('destination');
    expect(card.destinationId).toBe(sampleDestination.id);
    expect(resolveExploreWishlistTarget(card)).toEqual({
      destinationId: sampleDestination.id,
      alertOnMatch: true,
      watchOutingCategory: null,
      watchLatitude: sampleDestination.center.latitude,
      watchLongitude: sampleDestination.center.longitude,
    });
  });
});