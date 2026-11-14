import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveListFeedFooterModel } from './listFeedFooterActions';
import {
  resolveCampingPlaceFactLabels,
  resolveCatalogHeaderAreaLocationLine,
  resolveCatalogHubLabel,
  resolveCatalogRegionLabel,
  resolveHikingPlaceFactLabels,
  resolveListVenueListingCopy,
  resolveListVenuePosterCopy,
  resolveListVenuePosterFactLabels,
  resolveListVenueScheduleHint,
  resolveListVenueThumbnailFactLabels,
} from './listVenuePosterPresentation';

const venueItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'venue:v1',
    kind: 'hiking',
    source: 'venue',
    title: 'Wadi Shawka',
    latitude: 25.1,
    longitude: 56.2,
    path: '/trail/v1',
    subtitle: 'Wadi Ghalilah',
    locationCard: {
      id: 'v1',
      activityType: 'hiking',
      region: 'RAK',
      description: 'Trail',
      difficulty: 'moderate',
      distance: 8.5,
      childFriendly: true,
      accessibility: 'remote',
      season: ['winter'],
      images: [],
      featured: false,
      parkingLat: 25.1,
      parkingLng: 56.2,
    },
    presentation: {
      kind: 'hiking',
      source: 'venue',
      emoji: '🥾',
      headline: 'Wadi Shawka',
      listTitle: 'Wadi Shawka',
      listHost: null,
      subtitle: 'Wadi Ghalilah',
      primaryCta: 'View trail',
      secondaryCta: null,
      sections: { details: [] },
    },
    ...overrides,
  }) as ExploreMapItemDTO;

describe('listVenuePosterPresentation', () => {
  it('shows region above place name and hike fact pills', () => {
    const card = buildDiscoveryCardViewModelCard(venueItem());
    const copy = resolveListVenuePosterCopy(card);
    expect(copy.placeLine).toBe('RAK');
    expect(resolveCatalogHeaderAreaLocationLine(card)).toBe('RAK · Wadi Ghalilah');
    expect(copy.heroTitle).toBe('Wadi Shawka');
    expect(copy.titleLines.line1).toContain('Wadi');
    expect(resolveListVenuePosterFactLabels(card)).toEqual([
      'Wadi Ghalilah',
      'Child-friendly',
      'Parking available',
      'Moderate',
      '8.5 km',
      '4x4 required',
    ]);
    expect(resolveListVenueThumbnailFactLabels(card)).toEqual([
      'Child-friendly',
      'Parking available',
      'Moderate',
      '8.5 km',
      '4x4 required',
    ]);
    expect(resolveHikingPlaceFactLabels(card)).toEqual(['Moderate', '8.5 km']);
    expect(resolveCampingPlaceFactLabels(card)).toEqual([]);
  });

  it('keeps camping cards on surface and camping style, not trail kilometres', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueItem({
        id: 'venue:c1',
        kind: 'camping',
        title: 'Mleiha Desert Camp',
        subtitle: 'تخييم مليحة · Sharjah',
        areaName: 'Mleiha',
        presentation: {
          kind: 'camping',
          source: 'venue',
          emoji: '⛺',
          headline: 'Mleiha Desert Camp',
          listTitle: 'Mleiha Desert Camp',
          listHost: null,
          subtitle: 'تخييم مليحة · Sharjah',
          primaryCta: 'View camp',
          secondaryCta: null,
          sections: { details: [] },
        },
        locationCard: {
          id: 'c1',
          activityType: 'camping',
          region: 'Sharjah',
          description: 'Camp',
          childFriendly: true,
          accessibility: 'car-accessible',
          campingType: 'self-guided',
          maxGroupSize: 12,
          surfaceType: ['sand'],
          distance: 8.5,
          difficulty: 'moderate',
          season: ['winter'],
          images: [],
          featured: false,
          parkingLat: 25.1,
          parkingLng: 55.8,
          amenityLabels: ['Toilet'],
        },
      })
    );
    expect(resolveCatalogHeaderAreaLocationLine(card)).toBe('Sharjah · Mleiha');
    expect(resolveHikingPlaceFactLabels(card)).toEqual([]);
    expect(resolveCampingPlaceFactLabels(card)).toEqual([
      'Self-guided camping',
      'Sand',
      'Up to 12 people',
    ]);
    expect(resolveListVenueThumbnailFactLabels(card)).toEqual([
      'Child-friendly',
      'Parking available',
      'Toilet',
      'Self-guided camping',
      'Sand',
      'Up to 12 people',
      'Sedan access',
    ]);
    expect(resolveListVenueThumbnailFactLabels(card).some((label) => label.includes('km'))).toBe(
      false
    );
  });

  it('listing copy introduces title, emirate, hub, rating, and capped labels', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueItem({
        areaName: 'Wadi Ghalilah',
        averageRating: 4.8,
        reviewCount: 12,
      })
    );
    const listing = resolveListVenueListingCopy(card);
    expect(listing.title).toBe('Wadi Shawka');
    expect(resolveCatalogRegionLabel(card)).toBe('RAK');
    expect(resolveCatalogHubLabel(card)).toBe('Wadi Ghalilah');
    expect(listing.locationLine).toBe('RAK · Wadi Ghalilah');
    expect(listing.rating).toEqual({ average: 4.8, count: 12 });
    expect(listing.factLabels).toEqual([
      'Moderate',
      '8.5 km',
      'Child-friendly',
      'Parking available',
      '4x4 required',
    ]);
    expect(listing.hasDirections).toBe(true);
    expect(listing.canWishlist).toBe(true);
    expect(listing.rating).toEqual({ average: 4.8, count: 12 });
    expect(listing.scheduleHint).toBeNull();
  });

  it('omits unrated places and links a trip hint to the next outing', () => {
    const unrated = buildDiscoveryCardViewModelCard(venueItem());
    expect(resolveListVenueListingCopy(unrated).rating).toBeNull();
    const withTrips = {
      ...unrated,
      venueUpcomingOutingCount: 2,
      venueNextOutingIso: '2026-11-14',
      venueNextOutingPath: '/activity/next-hike',
      venueNextOutingExploreItemId: 'activity:next-hike',
    };
    expect(resolveListVenueListingCopy(withTrips).schedulePath).toBe('/activity/next-hike');
    expect(resolveListVenueScheduleHint(withTrips, new Date('2026-11-12T10:00:00'))).toBe(
      '2 trips · next Sat'
    );
    expect(
      resolveListVenueScheduleHint(
        { ...unrated, venueUpcomingOutingCount: 1, venueNextOutingIso: '2026-11-28' },
        new Date('2026-11-12T10:00:00')
      )
    ).toBe('1 trip · 28 Nov');
    expect(resolveListVenueScheduleHint({ ...unrated, venueUpcomingOutingCount: 1 }, new Date())).toBe(
      '1 trip scheduled'
    );
  });

  it('omits empty ratings and caps camping listing chips', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueItem({
        id: 'venue:c1',
        kind: 'camping',
        title: 'Mleiha Desert Camp',
        subtitle: 'تخييم مليحة · Sharjah',
        areaName: 'Mleiha',
        presentation: {
          kind: 'camping',
          source: 'venue',
          emoji: '⛺',
          headline: 'Mleiha Desert Camp',
          listTitle: 'Mleiha Desert Camp',
          listHost: null,
          subtitle: 'تخييم مليحة · Sharjah',
          primaryCta: 'View camp',
          secondaryCta: null,
          sections: { details: [] },
        },
        locationCard: {
          id: 'c1',
          activityType: 'camping',
          region: 'Sharjah',
          description: 'Camp',
          childFriendly: true,
          accessibility: 'car-accessible',
          campingType: 'self-guided',
          maxGroupSize: 12,
          surfaceType: ['sand'],
          distance: 8.5,
          difficulty: 'moderate',
          season: ['winter'],
          images: [],
          featured: false,
          parkingLat: 25.1,
          parkingLng: 55.8,
          amenityLabels: ['Toilet'],
        },
      })
    );
    const listing = resolveListVenueListingCopy(card);
    expect(listing.rating).toBeNull();
    expect(listing.factLabels).toHaveLength(5);
    expect(listing.factLabels).toEqual([
      'Self-guided camping',
      'Sand',
      'Child-friendly',
      'Parking available',
      'Toilet',
    ]);
  });

  it('uses Plan trip + Details on place posters (map peek copy)', () => {
    const card = buildDiscoveryCardViewModelCard(venueItem());
    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary).toMatchObject({
      kind: 'plan_trip',
      label: 'Plan trip',
    });
    expect(model.secondary).toMatchObject({
      kind: 'link',
      label: 'Details',
    });
  });

  it('uses Get Directions + View Details on facility posters', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueItem({
        id: 'facility:f1',
        source: 'facility',
        path: '/facility/f1',
        presentation: {
          kind: 'hiking',
          source: 'facility',
          emoji: '🚻',
          headline: 'Parking',
          listTitle: 'Parking',
          listHost: null,
          subtitle: null,
          primaryCta: 'View details',
          secondaryCta: null,
          sections: { details: [] },
        },
      })
    );
    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary).toMatchObject({
      kind: 'directions',
      label: 'Get Directions',
    });
    expect(model.secondary).toMatchObject({
      kind: 'link',
      label: 'View Details',
    });
  });
});
