import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveListFeedFooterModel } from './listFeedFooterActions';
import {
  browseCatalogHeaderLocationLine,
  browseCatalogHubLabel,
  browseCatalogRegionLabel,
} from './browseCatalogLabels';
import {
  resolveCampingPlaceFactLabels,
  resolveHikingPlaceFactLabels,
  resolveVenueBrowseThumbnailFactLabels,
} from './venueBrowseFacts';
import {
  resolveVenueBrowseCardCopy,
  resolveVenueBrowsePosterCopy,
  resolveVenueBrowsePosterFactLabels,
  resolveVenueBrowseScheduleHint,
} from './venueBrowseCardCopy';
import { resolveDiscoveryBrowseListPolicyLabels } from '../../discovery/browse/resolveDiscoveryBrowseListImageChrome';

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

describe('venue browse presentation', () => {
  it('shows region above place name and hike fact pills', () => {
    const card = buildDiscoveryCardViewModelCard(venueItem());
    const copy = resolveVenueBrowsePosterCopy(card);
    expect(copy.placeLine).toBe('RAK');
    expect(browseCatalogHeaderLocationLine(card)).toBe('RAK · Wadi Ghalilah');
    expect(copy.heroTitle).toBe('Wadi Shawka');
    expect(copy.titleLines.line1).toContain('Wadi');
    expect(resolveVenueBrowsePosterFactLabels(card)).toEqual([
      'Wadi Ghalilah',
      'Child-friendly',
      'Parking available',
      'Moderate',
      '8.5 km',
      '4x4 required',
    ]);
    expect(resolveVenueBrowseThumbnailFactLabels(card)).toEqual([
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
        areaLabel: 'Mleiha',
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
    expect(browseCatalogHeaderLocationLine(card)).toBe('Sharjah · Mleiha');
    expect(resolveHikingPlaceFactLabels(card)).toEqual([]);
    expect(resolveCampingPlaceFactLabels(card)).toEqual([
      'Self-guided camping',
      'Sand',
      'Up to 12 people',
    ]);
    expect(resolveVenueBrowseThumbnailFactLabels(card)).toEqual([
      'Child-friendly',
      'Parking available',
      'Toilet',
      'Self-guided camping',
      'Sand',
      'Up to 12 people',
      'Sedan access',
    ]);
    expect(resolveVenueBrowseThumbnailFactLabels(card).some((label) => label.includes('km'))).toBe(
      false
    );
  });

  it('listing copy introduces title, emirate, hub, rating, and capped labels', () => {
    const card = buildDiscoveryCardViewModelCard(
      venueItem({
        areaLabel: 'Wadi Ghalilah',
        averageRating: 4.8,
        reviewCount: 12,
      })
    );
    const listing = resolveVenueBrowseCardCopy(card);
    expect(listing.title).toBe('Wadi Shawka');
    expect(browseCatalogRegionLabel(card)).toBe('RAK');
    expect(browseCatalogHubLabel(card)).toBe('Wadi Ghalilah');
    expect(listing.locationLine).toBe('RAK · Wadi Ghalilah');
    expect(listing.rating).toEqual({ average: 4.8, count: 12 });
    expect(listing.factLabels).toEqual(['Moderate', '8.5 km', 'Parking available']);
    expect(resolveDiscoveryBrowseListPolicyLabels(card)).toContain('Child-friendly');
    expect(listing.hasDirections).toBe(true);
    expect(listing.canWishlist).toBe(true);
    expect(listing.rating).toEqual({ average: 4.8, count: 12 });
    expect(listing.scheduleHint).toBeNull();
  });

  it('omits unrated places and links a trip hint to the next outing', () => {
    const unrated = buildDiscoveryCardViewModelCard(venueItem());
    expect(resolveVenueBrowseCardCopy(unrated).rating).toBeNull();
    const withTrips = {
      ...unrated,
      venueUpcomingOutingCount: 2,
      venueNextOutingIso: '2026-11-14',
      venueNextOutingPath: '/activity/next-hike',
      venueNextOutingExploreItemId: 'activity:next-hike',
    };
    expect(resolveVenueBrowseCardCopy(withTrips).schedulePath).toBe('/activity/next-hike');
    expect(resolveVenueBrowseScheduleHint(withTrips, new Date('2026-11-12T10:00:00'))).toBe(
      '2 trips · next 14 Nov'
    );
    expect(
      resolveVenueBrowseScheduleHint(
        { ...unrated, venueUpcomingOutingCount: 1, venueNextOutingIso: '2026-11-28' },
        new Date('2026-11-12T10:00:00')
      )
    ).toBe('1 trip · 28 Nov');
    expect(resolveVenueBrowseScheduleHint({ ...unrated, venueUpcomingOutingCount: 1 }, new Date())).toBe(
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
        areaLabel: 'Mleiha',
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
    const listing = resolveVenueBrowseCardCopy(card);
    expect(listing.rating).toBeNull();
    expect(listing.factLabels).toHaveLength(4);
    expect(listing.factLabels).toEqual([
      'Self-guided camping',
      'Sand',
      'Parking available',
      'Toilet',
    ]);
    expect(resolveDiscoveryBrowseListPolicyLabels(card)).toContain('Child-friendly');
  });

  it('uses Plan Trip + Get Directions on place browse footers', () => {
    const card = buildDiscoveryCardViewModelCard(venueItem());
    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary).toMatchObject({
      kind: 'plan_trip',
      label: 'Plan Trip',
    });
    expect(model.secondary).toMatchObject({
      kind: 'directions',
      label: 'Get Directions',
    });
  });

  it('uses Plan Trip + Get Directions on facility browse footers', () => {
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
      kind: 'plan_trip',
      label: 'Plan Trip',
    });
    expect(model.secondary).toMatchObject({
      kind: 'directions',
      label: 'Get Directions',
    });
  });
});