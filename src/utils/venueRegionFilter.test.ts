import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { venueItemMatchesRegions } from './venueRegionFilter';

describe('venueItemMatchesRegions', () => {
  it('matches Dubai filter when sub-area is Hatta but emirate is Dubai', () => {
    const item: ExploreMapItemDTO = {
      id: 'activity:1',
      kind: 'event',
      source: 'activity',
      title: 'Desert run',
      subtitle: 'Hatta loop',
      latitude: 24.8,
      longitude: 56.1,
      path: '/activity/1',
      activity: {
        id: '1',
        tenantId: 't',
        tenantSlug: 'host',
        locationId: 'loc',
        locationName: 'Hatta',
        region: 'Hatta',
        groupRegionLevels: { l1: 'AE', l2: 'Dubai', l3: 'Hatta', l4: null },
        activityType: 'event',
        title: 'Desert run',
        description: 'Group outing',
        date: '2026-11-01',
        time: '07:00',
        price: 0,
        slotsTotal: 10,
        slotsAvailable: 5,
        status: 'published',
        hostName: 'Host',
      },
    };

    expect(venueItemMatchesRegions(item, ['Dubai'])).toBe(true);
    expect(venueItemMatchesRegions(item, ['Sharjah'])).toBe(false);
  });

  it('matches shop explore items by top-level groupRegionLevels', () => {
    const item: ExploreMapItemDTO = {
      id: 'shop:1',
      kind: 'shop',
      source: 'shop',
      title: 'Trail Gear',
      latitude: 25.2,
      longitude: 55.27,
      path: '/shop/1',
      groupRegionLevels: { l1: 'AE', l2: 'Dubai', l3: null, l4: null },
    };

    expect(venueItemMatchesRegions(item, ['Dubai'])).toBe(true);
    expect(venueItemMatchesRegions(item, ['Sharjah'])).toBe(false);
  });
});
