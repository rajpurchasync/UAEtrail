import { describe, expect, it } from 'vitest';
import { geoActivityToExploreItem, geoPlaceToExploreItem } from './geoCatalogToExploreItems';

describe('geoCatalogToExploreItems', () => {
  it('maps a place to a venue explore item', () => {
    const item = geoPlaceToExploreItem({
      _id: 'loc-1',
      name: 'Hatta Dam',
      activityType: 'hiking',
      latitude: 24.8,
      longitude: 56.1,
      images: ['https://img/hatta.jpg'],
    });
    expect(item?.id).toBe('venue:loc-1');
    expect(item?.source).toBe('venue');
    expect(item?.kind).toBe('hiking');
    expect(item?.path).toContain('/place/');
  });

  it('maps an outing to an activity explore item with schedule', () => {
    const item = geoActivityToExploreItem({
      _id: 'act-1',
      title: 'Sunrise run',
      activityType: 'event',
      startAt: '2026-11-12T06:30:00.000Z',
      meetingLat: 25.1,
      meetingLng: 55.2,
    });
    expect(item?.id).toBe('activity:act-1');
    expect(item?.source).toBe('activity');
    expect(item?.kind).toBe('event');
    expect(item?.date).toBeTruthy();
    expect(item?.path).toContain('/activity/');
  });
});
