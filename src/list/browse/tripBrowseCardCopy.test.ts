import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveTripBrowseCardCopy } from './tripBrowseCardCopy';
import { LIST_FEED_CTA_CARPOOL } from '../listFeedCtaCopy';

const hikeItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'activity:a1',
    kind: 'hiking',
    source: 'activity',
    title: 'Shawka sunrise hike',
    latitude: 25,
    longitude: 56,
    path: '/activity/a1',
    date: '2026-11-20',
    time: '09:00',
    featuredPerson: {
      userId: 'u1',
      displayName: 'Omar Hassan',
      avatarUrl: 'https://cdn.example/omar.jpg',
      role: 'host',
    },
    activity: {
      id: 'a1',
      tenantId: 't1',
      tenantSlug: 'host',
      locationId: 'l1',
      locationName: 'Wadi Shawka',
      activityType: 'hiking',
      title: 'Shawka sunrise hike',
      description: '',
      date: '2026-11-20',
      time: '09:00',
      price: 0,
      slotsTotal: 10,
      slotsAvailable: 5,
      status: 'published',
      hostUserId: 'u1',
      hostName: 'Omar Hassan',
      hostAvatar: 'https://cdn.example/omar.jpg',
      requirements: ['Women only', 'Pets allowed', 'Difficulty: Hard'],
    },
    ...overrides,
  }) as ExploreMapItemDTO;

describe('resolveTripBrowseCardCopy', () => {
  it('puts when, price, host, hiking labels, and linked carpool on the listing', () => {
    const card = buildDiscoveryCardViewModelCard(
      hikeItem({
        linkedRideshareActivities: [
          {
            activityId: 'r1',
            exploreItemId: 'activity:r1',
            title: 'Pickup from Dubai',
            path: '/activity/r1',
          },
        ],
      })
    );
    const copy = resolveTripBrowseCardCopy(card);
    expect(copy.title).toBe('Shawka sunrise hike');
    expect(copy.metaLine).toMatch(/Wadi Shawka/);
    expect(copy.metaLine).toMatch(/20 Nov/);
    expect(copy.metaLine).not.toMatch(/Free/);
    expect(copy.visibleFactLabels).toHaveLength(3);
    expect(copy.locationLine).toBe('Wadi Shawka');
    expect(copy.whenLine).toMatch(/20 Nov/);
    expect(copy.whenLine).toMatch(/9:00 AM/);
    expect(copy.price).toBe('Free');
    expect(copy.hostName).toBe('Omar Hassan');
    expect(copy.hostAvatar).toBe('https://cdn.example/omar.jpg');
    expect(copy.factLabels).toEqual(['Women only', 'Pets welcome', 'Hard']);
    expect(copy.carpool).toEqual({
      label: LIST_FEED_CTA_CARPOOL,
      path: '/activity/r1',
      exploreItemId: 'activity:r1',
    });
  });

  it('uses parent plan path when multiple carpools are linked', () => {
    const card = buildDiscoveryCardViewModelCard(
      hikeItem({
        linkedRideshareActivities: [
          {
            activityId: 'r1',
            exploreItemId: 'activity:r1',
            title: 'Pickup Dubai',
            path: '/activity/r1',
          },
          {
            activityId: 'r2',
            exploreItemId: 'activity:r2',
            title: 'Pickup Sharjah',
            path: '/activity/r2',
          },
        ],
      })
    );
    expect(resolveTripBrowseCardCopy(card).carpool).toEqual({
      label: '2 carpools available',
      path: '/activity/a1',
      exploreItemId: 'activity:a1',
    });
  });

  it('uses trail difficulty when the outing has no stored difficulty line', () => {
    const card = buildDiscoveryCardViewModelCard(
      hikeItem({
        locationCard: {
          id: 'l1',
          activityType: 'hiking',
          region: 'RAK',
          description: 'Trail',
          difficulty: 'moderate',
          season: ['winter'],
          images: [],
          featured: false,
        },
        activity: {
          id: 'a1',
          tenantId: 't1',
          tenantSlug: 'host',
          locationId: 'l1',
          locationName: 'Wadi Shawka',
          activityType: 'hiking',
          title: 'Shawka sunrise hike',
          description: '',
          date: '2026-11-20',
          time: '09:00',
          price: 150,
          slotsTotal: 10,
          slotsAvailable: 5,
          status: 'published',
          hostUserId: 'u1',
          requirements: ['Women only'],
        },
      })
    );
    const copy = resolveTripBrowseCardCopy(card);
    expect(copy.price).toBe('AED 150');
    expect(copy.factLabels).toContain('Medium');
    expect(copy.factLabels).toContain('Women only');
    expect(copy.factLabels).toContain('Pets welcome');
    expect(copy.carpool).toBeNull();
  });

  it('does not treat a rideshare outing as having a nested carpool chip', () => {
    const card = buildDiscoveryCardViewModelCard(
      hikeItem({
        id: 'activity:r1',
        kind: 'rideshare',
        path: '/activity/r1',
        linkedRideshareActivities: [
          {
            activityId: 'r2',
            exploreItemId: 'activity:r2',
            title: 'Other ride',
            path: '/activity/r2',
          },
        ],
        activity: {
          id: 'r1',
          tenantId: 't1',
          tenantSlug: 'host',
          locationId: 'l1',
          locationName: 'Dubai',
          activityType: 'rideshare',
          title: 'Pickup from Dubai',
          description: '',
          date: '2026-11-20',
          time: '07:00',
          price: 0,
          slotsTotal: 3,
          slotsAvailable: 2,
          status: 'published',
        },
      })
    );
    expect(resolveTripBrowseCardCopy(card).carpool).toBeNull();
  });

  it('inherits place logistics when linked and no carpool', () => {
    const card = buildDiscoveryCardViewModelCard(
      hikeItem({
        locationCard: {
          id: 'l1',
          activityType: 'hiking',
          region: 'RAK',
          description: 'Trail',
          accessibility: 'remote',
          season: ['winter'],
          images: [],
          featured: false,
          parkingLat: 25.1,
          parkingLng: 55.2,
          amenityLabels: ['Toilet'],
        },
        activity: {
          id: 'a1',
          tenantId: 't1',
          tenantSlug: 'host',
          locationId: 'l1',
          locationName: 'Wadi Shawka',
          activityType: 'hiking',
          title: 'Shawka sunrise hike',
          description: '',
          date: '2026-11-20',
          time: '09:00',
          price: 0,
          slotsTotal: 10,
          slotsAvailable: 5,
          status: 'published',
          hostUserId: 'u1',
          requirements: [],
        },
      })
    );
    const copy = resolveTripBrowseCardCopy(card);
    expect(copy.placeLogisticsLabels).toEqual(['4x4 required', 'Parking available']);
    expect(copy.carpool).toBeNull();
  });
});