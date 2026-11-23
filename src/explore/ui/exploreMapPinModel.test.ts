import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { hostedExploreMapItem, seekingExploreMapItem, venueExploreMapItem } from '../exploreMapItemFixtures';
import { matchesActivityDateFilter } from '../exploreActivityDateFilter';
import {
  expandMapPins,
  isShopListItem,
  layoutColocatedMapPins,
  matchesUnifiedExploreMapItem,
  matchesPlacesMapFilter,
  matchesOthersMapFilter,
  isPlacesMapItem,
  isFriendMapItem,
  resolveExploreItemIdFromMapPin,
} from './exploreMapPinModel';

const baseItem = (overrides: Partial<ExploreMapItemDTO>): ExploreMapItemDTO =>
  ({
    id: 'x',
    title: 'Test',
    kind: 'hiking',
    source: 'activity',
    latitude: 25.0,
    longitude: 55.0,
    path: '/activity/x',
    ...overrides,
  }) as ExploreMapItemDTO;

describe('exploreMapPinModel', () => {
  it('matchesUnifiedExploreMapItem respects hiking topic across activities and venues', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', kind: 'hiking' });
    const venue = baseItem({ id: 'v1', source: 'venue', kind: 'hiking' });
    const filter = { mapFilter: 'hiking' as const, pinKind: 'all' as const };
    expect(matchesUnifiedExploreMapItem(activity, filter)).toBe(true);
    expect(matchesUnifiedExploreMapItem(venue, filter)).toBe(true);
    expect(matchesUnifiedExploreMapItem(activity, { ...filter, mapFilter: 'camping' })).toBe(false);
  });

  it('places facilities filter matches amenity pins and excludes camp spots', () => {
    const toilet = baseItem({
      id: 'facility:1',
      source: 'facility',
      kind: 'event',
      placeKind: 'toilet',
    });
    const camp = venueExploreMapItem({ id: 'venue:camp', kind: 'camping' });
    expect(matchesPlacesMapFilter(toilet, 'facilities')).toBe(true);
    expect(matchesPlacesMapFilter(camp, 'facilities')).toBe(false);
    expect(matchesPlacesMapFilter(toilet, 'camping')).toBe(false);
    expect(matchesPlacesMapFilter(toilet, 'others')).toBe(false);
  });

  it('Places layer excludes activities and demand', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', kind: 'hiking' });
    const demand = seekingExploreMapItem({ intentId: 'd1' });
    const venue = venueExploreMapItem({ id: 'venue:v1' });
    const eventVenue = baseItem({ id: 'ev1', source: 'venue', kind: 'event' });
    expect(isPlacesMapItem(activity)).toBe(false);
    expect(isFriendMapItem(activity)).toBe(true);
    expect(matchesPlacesMapFilter(activity, 'hiking')).toBe(false);
    expect(matchesPlacesMapFilter(demand, 'all')).toBe(false);
    expect(matchesPlacesMapFilter(venue, 'hiking')).toBe(true);
    expect(matchesOthersMapFilter(venue, 'hiking')).toBe(false);
    expect(isPlacesMapItem(eventVenue)).toBe(false);
  });

  it('isShopListItem excludes product pins', () => {
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'shop:1' }))).toBe(true);
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'product:1' }))).toBe(false);
  });

  it('matchesActivityDateFilter keeps venues and filters scheduled activities', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', date: '2026-09-12' });
    const venue = baseItem({ id: 'v1', source: 'venue', kind: 'hiking' });
    expect(matchesActivityDateFilter(activity, 'anyday')).toBe(true);
    expect(matchesActivityDateFilter(venue, 'today')).toBe(true);
  });

  it('expandMapPins sets hostedTripCount on venues with upcoming outings', () => {
    const placeId = 'loc-trail-1';
    const hosted = hostedExploreMapItem({
      date: '2026-12-01',
      activity: { locationId: placeId } as ExploreMapItemDTO['activity'],
    });
    const venue = venueExploreMapItem({
      locationCard: { id: placeId, name: 'Trail', activityType: 'hiking' },
    });
    const pin = expandMapPins([hosted, venue]).find((row) => row.id === venue.id);
    expect(pin?.hostedTripCount).toBe(1);
  });

  it('expandMapPins resolves activityMode for hosted and seeking', () => {
    const hosted = expandMapPins([hostedExploreMapItem()])[0];
    const seeking = expandMapPins([seekingExploreMapItem()])[0];
    expect(hosted.activityMode).toBe('hosted');
    expect(seeking.activityMode).toBe('seeking');
  });

  it('expandMapPins adds carpool destination pin when to-coords differ', () => {
    const pins = expandMapPins([
      baseItem({
        id: 'c1',
        kind: 'rideshare',
        source: 'activity',
        latitude: 25,
        longitude: 55,
        toLatitude: 25.1,
        toLongitude: 55.1,
      }),
    ]);
    expect(pins).toHaveLength(2);
    expect(pins[0].rideshareEndpoint).toBe('from');
    expect(pins[1].rideshareEndpoint).toBe('to');
    expect(pins[1].id).toBe('c1:to');
  });

  it('layoutColocatedMapPins keeps one marker per item so clusters can spiderfy', () => {
    const pins = expandMapPins([
      baseItem({ id: 'h1', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'h2', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'c1', kind: 'camping', source: 'activity', latitude: 25, longitude: 55 }),
    ]);
    const laidOut = layoutColocatedMapPins(pins);
    expect(laidOut).toHaveLength(3);
    expect(laidOut.every((pin) => pin.stackCount === 1)).toBe(true);
  });

  it('layoutColocatedMapPins does not merge same-emoji pins at one coordinate', () => {
    const pins = expandMapPins([
      baseItem({ id: 'h1', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'h2', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
    ]);
    const laidOut = layoutColocatedMapPins(pins);
    expect(laidOut).toHaveLength(2);
    expect(laidOut[0].colocatedEntries).toBeUndefined();
  });

  it('resolveExploreItemIdFromMapPin prefers explicit exploreItemId', () => {
    const pin = {
      id: 'colocate:a+b',
      exploreItemId: 'ride',
      stackExploreItemIds: ['hike'],
    } as ReturnType<typeof expandMapPins>[0];
    expect(resolveExploreItemIdFromMapPin(pin)).toBe('ride');
  });

  it('layoutColocatedMapPins sets stackCount 1 for a lone pin at a coordinate', () => {
    const pins = expandMapPins([
      baseItem({ id: 'h1', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
    ]);
    const laidOut = layoutColocatedMapPins(pins);
    expect(laidOut).toHaveLength(1);
    expect(laidOut[0].stackCount).toBe(1);
  });
});
