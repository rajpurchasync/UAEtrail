import { describe, expect, it } from 'vitest';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import { HOME_HERO_OG_PATH } from '../config/seo';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildVenueCoverByLocationId,
  enrichBrowsePosterCover,
  resolveBrowsePosterCoverUrl,
} from './browsePosterCover';

describe('browsePosterCover', () => {
  it('maps venue pins to location cover URLs', () => {
    const venue: ExploreMapItemDTO = {
      id: 'venue:loc-1',
      kind: 'hiking',
      source: 'venue',
      title: 'Wadi Shawka',
      latitude: 25,
      longitude: 56,
      path: '/trail/loc-1',
      image: '/uploads/wadi-shawka.jpg',
      locationCard: {
        id: 'loc-1',
        activityType: 'hiking',
        region: 'Sharjah',
        description: 'Trail',
        childFriendly: true,
        season: ['winter'],
        images: ['/uploads/wadi-shawka.jpg'],
        featured: false,
      },
    };

    const map = buildVenueCoverByLocationId([venue]);
    expect(map.get('loc-1')).toBe('/uploads/wadi-shawka.jpg');
  });

  it('uses venue cover for activities when outing photos are stock placeholders', () => {
    const venue: ExploreMapItemDTO = {
      id: 'venue:loc-1',
      kind: 'hiking',
      source: 'venue',
      title: 'Wadi Shawka',
      latitude: 25,
      longitude: 56,
      path: '/trail/loc-1',
      image: '/uploads/wadi-shawka.jpg',
      locationCard: {
        id: 'loc-1',
        activityType: 'hiking',
        region: 'Sharjah',
        description: 'Trail',
        childFriendly: true,
        season: ['winter'],
        images: ['/uploads/wadi-shawka.jpg'],
        featured: false,
      },
    };

    const activity: ExploreMapItemDTO = {
      id: 'activity:a1',
      kind: 'hiking',
      source: 'activity',
      title: 'Sunrise hike',
      latitude: 25,
      longitude: 56,
      path: '/activity/a1',
      image: HOME_HERO_OG_PATH,
      activity: {
        id: 'a1',
        tenantId: 't1',
        tenantSlug: 'host',
        locationId: 'loc-1',
        locationName: 'Wadi Shawka',
        activityType: 'hiking',
        title: 'Sunrise hike',
        description: '',
        date: '2026-10-12',
        time: '09:00',
        price: 0,
        slotsTotal: 10,
        slotsAvailable: 5,
        status: 'published',
        bannerUrl: HOME_HERO_OG_PATH,
      },
    };

    const venueCovers = buildVenueCoverByLocationId([venue]);
    const card = enrichBrowsePosterCover(buildExploreCardModel(activity), venueCovers);

    expect(resolveBrowsePosterCoverUrl(card)).toBe('/uploads/wadi-shawka.jpg');
  });
});
