import { describe, expect, it } from 'vitest';
import { venueExploreMapItem } from '../explore/exploreMapItemFixtures';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { resolvePlaceMapPeekViewModel } from './resolvePlaceMapPeekViewModel';

describe('resolvePlaceMapPeekViewModel', () => {
  it('bundles title, chips, and directions flags', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueExploreMapItem({
        subtitle: 'Dubai · Al Barsha',
        locationCard: {
          images: ['https://example.com/park.jpg'],
          activityType: 'event',
          amenityLabels: ['Water refill', 'Parking'],
        },
      } as Parameters<typeof venueExploreMapItem>[0])
    );
    const vm = resolvePlaceMapPeekViewModel(
      {
        ...card,
        averageRating: 4.8,
        reviewCount: 120,
        mapLatitude: 25.1,
        mapLongitude: 55.2,
        venueAmenityLabels: ['3 Refill fountains'],
      },
      { lat: 25.05, lng: 55.15 }
    );
    expect(vm.title).toBeTruthy();
    expect(vm.amenityChips.length).toBeGreaterThan(0);
    expect(vm.hasDirections).toBe(true);
    expect(vm.metaLine).toMatch(/away/i);
    expect(vm.averageRating).toBe(4.8);
  });
});