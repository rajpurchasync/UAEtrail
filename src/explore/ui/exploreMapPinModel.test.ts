import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { expandMapPins, isShopListItem, layoutColocatedMapPins, matchesActivityDateFilter, matchesMapFilter, matchesPlacesMapFilter, matchesBuddyMapFilter, isPlacesMapItem, isBuddyMapItem } from './exploreMapPinModel';

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
  it('matchesMapFilter respects hiking activities and venues', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', kind: 'hiking' });
    const venue = baseItem({ id: 'v1', source: 'venue', kind: 'hiking' });
    expect(matchesMapFilter(activity, 'hiking')).toBe(true);
    expect(matchesMapFilter(venue, 'hiking')).toBe(true);
    expect(matchesMapFilter(activity, 'camping')).toBe(false);
  });

  it('Places layer excludes activities and demand', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', kind: 'hiking' });
    const demand = baseItem({ id: 'd1', source: 'demand', kind: 'hiking' });
    const venue = baseItem({ id: 'v1', source: 'venue', kind: 'hiking' });
    const eventVenue = baseItem({ id: 'ev1', source: 'venue', kind: 'event' });
    expect(isPlacesMapItem(activity)).toBe(false);
    expect(isBuddyMapItem(activity)).toBe(true);
    expect(matchesPlacesMapFilter(activity, 'hiking')).toBe(false);
    expect(matchesPlacesMapFilter(demand, 'all')).toBe(false);
    expect(matchesPlacesMapFilter(venue, 'hiking')).toBe(true);
    expect(matchesBuddyMapFilter(venue, 'hiking')).toBe(false);
    expect(isPlacesMapItem(eventVenue)).toBe(false);
  });

  it('isShopListItem excludes product pins', () => {
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'shop:1' }))).toBe(true);
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'product:1' }))).toBe(false);
  });

  it('matchesActivityDateFilter keeps venues and filters scheduled activities', () => {
    const activity = baseItem({ id: 'a1', source: 'activity', date: '2026-09-12' });
    const venue = baseItem({ id: 'v1', source: 'venue', kind: 'hiking' });
    expect(matchesActivityDateFilter(activity, '2026-09-12')).toBe(true);
    expect(matchesActivityDateFilter(activity, '2026-09-13')).toBe(false);
    expect(matchesActivityDateFilter(venue, '2026-09-12')).toBe(true);
    expect(matchesActivityDateFilter(activity, null)).toBe(true);
  });

  it('expandMapPins adds carpool destination pin when to-coords differ', () => {
    const pins = expandMapPins([
      baseItem({
        id: 'c1',
        kind: 'carpool',
        source: 'activity',
        latitude: 25,
        longitude: 55,
        toLatitude: 25.1,
        toLongitude: 55.1,
      }),
    ]);
    expect(pins).toHaveLength(2);
    expect(pins[0].carpoolEndpoint).toBe('from');
    expect(pins[1].carpoolEndpoint).toBe('to');
    expect(pins[1].id).toBe('c1:to');
  });

  it('layoutColocatedMapPins splits emojis and stacks same emoji counts', () => {
    const pins = expandMapPins([
      baseItem({ id: 'h1', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'h2', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'c1', kind: 'camping', source: 'activity', latitude: 25, longitude: 55 }),
    ]);
    const laidOut = layoutColocatedMapPins(pins);
    expect(laidOut).toHaveLength(1);
    expect(laidOut[0].colocatedEntries).toHaveLength(2);
    const hiking = laidOut[0].colocatedEntries!.find((e) => e.activityType === 'hiking');
    const camping = laidOut[0].colocatedEntries!.find((e) => e.activityType === 'camping');
    expect(hiking?.stackCount).toBe(2);
    expect(hiking?.stackExploreItemIds).toEqual(['h1', 'h2']);
    expect(camping?.stackCount).toBeUndefined();
  });

  it('layoutColocatedMapPins keeps single stack pin when only one emoji group', () => {
    const pins = expandMapPins([
      baseItem({ id: 'h1', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
      baseItem({ id: 'h2', kind: 'hiking', source: 'activity', latitude: 25, longitude: 55 }),
    ]);
    const laidOut = layoutColocatedMapPins(pins);
    expect(laidOut).toHaveLength(1);
    expect(laidOut[0].colocatedEntries).toBeUndefined();
    expect(laidOut[0].stackCount).toBe(2);
  });
});
