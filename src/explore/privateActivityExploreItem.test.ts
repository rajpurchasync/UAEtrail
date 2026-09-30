import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { buildExploreMapItemFromActivity, parseActivityMapItemId } from './privateActivityExploreItem';

describe('privateActivityExploreItem', () => {
  it('parses activity map item ids', () => {
    expect(parseActivityMapItemId('activity:abc-123')).toBe('abc-123');
    expect(parseActivityMapItemId('venue:x')).toBeNull();
  });

  it('builds a link-only peek row from activity dto', () => {
    const activity = {
      id: 'a1',
      tenantId: 't1',
      tenantSlug: 'host',
      locationId: 'loc1',
      title: 'Camp night',
      activityType: 'camping',
      locationName: 'Liwa',
      description: 'Overnight camp',
      date: '2026-11-01',
      time: '18:00',
      price: 0,
      slotsTotal: 10,
      slotsAvailable: 8,
      joinMode: 'private',
      participationMode: 'rsvp',
      meetingLat: 23.1,
      meetingLng: 54.2,
      status: 'published',
    } satisfies ActivityDTO;
    const item = buildExploreMapItemFromActivity(activity);

    expect(item.id).toBe('activity:a1');
    expect(item.source).toBe('activity');
    expect(item.latitude).toBe(23.1);
    expect(item.activity?.joinMode).toBe('private');
  });
});
