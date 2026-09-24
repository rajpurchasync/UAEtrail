import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { expandMapPins, isShopListItem, matchesMapFilter } from './exploreMapPinModel';

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

  it('isShopListItem excludes product pins', () => {
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'shop:1' }))).toBe(true);
    expect(isShopListItem(baseItem({ source: 'shop', kind: 'shop', id: 'product:1' }))).toBe(false);
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
});
