import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  DISCOVER_RAIL_LIMIT,
  pickDiscoverShopRailCards,
  pickDiscoverTripRailCards,
  pickDiscoverVenueRailCards,
} from './listDiscoverRails';

const activityItem = (id: string, date: string, featured = false, locationId = 'loc-1'): ExploreMapItemDTO => ({
  id: `activity:${id}`,
  kind: 'hiking',
  source: 'activity',
  title: `Trip ${id}`,
  latitude: 25,
  longitude: 55,
  path: `/activity/${id}`,
  date,
  time: '09:00',
  activity: {
    id,
    tenantId: 't1',
    tenantSlug: 'host',
    locationId,
    locationName: 'Place',
    activityType: 'hiking',
    title: `Trip ${id}`,
    description: '',
    date,
    time: '09:00',
    price: 0,
    slotsTotal: 10,
    slotsAvailable: 5,
    status: 'published',
    featured,
  },
});

describe('listDiscoverRails', () => {
  it('limits upcoming trips to featured first then next by date', () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const day2 = new Date(tomorrow);
    day2.setUTCDate(day2.getUTCDate() + 1);
    const d1 = tomorrow.toISOString().slice(0, 10);
    const d2 = day2.toISOString().slice(0, 10);

    const items = [
      activityItem('b', d2, false),
      activityItem('a', d1, true),
      activityItem('c', d1, false),
    ];
    const cards = items.map((item) => buildDiscoveryCardViewModelCard(item));
    const picked = pickDiscoverTripRailCards(cards, DISCOVER_RAIL_LIMIT);
    expect(picked.map((c) => c.activity?.id)).toEqual(['a', 'c', 'b']);
  });

  it('ranks venues by hosted count after featured', () => {
    const venueA: ExploreMapItemDTO = {
      id: 'venue:loc-a',
      kind: 'hiking',
      source: 'venue',
      title: 'A',
      latitude: 25,
      longitude: 55,
      path: '/trail/a',
      locationCard: {
        id: 'loc-a',
        activityType: 'hiking',
        region: 'UAE',
        description: '',
        childFriendly: true,
        season: [],
        images: [],
        featured: false,
      },
    };
    const venueB: ExploreMapItemDTO = {
      ...venueA,
      id: 'venue:loc-b',
      title: 'B',
      path: '/trail/b',
      locationCard: { ...venueA.locationCard!, id: 'loc-b', featured: true },
    };
    const mapItems = [
      venueA,
      venueB,
      activityItem('1', '2099-01-01', false, 'loc-a'),
      activityItem('2', '2099-01-02', false, 'loc-a'),
    ];
    const cards = [venueA, venueB].map((item) => buildDiscoveryCardViewModelCard(item));
    const picked = pickDiscoverVenueRailCards(cards, mapItems);
    expect(picked.map((c) => c.locationId)).toEqual(['loc-b', 'loc-a']);
  });

  it('shops rail prefers featured then fills with other shops', () => {
    const featuredShop: ExploreMapItemDTO = {
      id: 'shop:featured',
      kind: 'shop',
      source: 'shop',
      title: 'Featured Gear',
      latitude: 25,
      longitude: 55,
      path: '/shop/featured',
      discoverFeatured: true,
    };
    const otherShop: ExploreMapItemDTO = {
      id: 'shop:other',
      kind: 'shop',
      source: 'shop',
      title: 'Alpha Outfitters',
      latitude: 25.1,
      longitude: 55.1,
      path: '/shop/other',
      discoverFeatured: false,
    };
    const cards = [featuredShop, otherShop].map((item) => buildDiscoveryCardViewModelCard(item));
    const picked = pickDiscoverShopRailCards(cards, [featuredShop, otherShop]);
    expect(picked.map((c) => c.id)).toEqual(['shop:featured', 'shop:other']);
  });

  it('shops rail is empty when map has no shops (no fabricated placeholders)', () => {
    const picked = pickDiscoverShopRailCards([], []);
    expect(picked).toEqual([]);
  });
});
