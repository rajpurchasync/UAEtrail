import { describe, expect, it } from 'vitest';
import { buildPlanCalendarMaps } from './planCalendarMarkers';

describe('buildPlanCalendarMaps', () => {
  it('marks availability, hosting, joined, and map outings per day', () => {
    const { markers, details } = buildPlanCalendarMaps({
      availabilitySlots: [{ startDate: '2026-10-15', endDate: '2026-10-15' }],
      joinedActivities: [
        {
          id: 'a-join',
          title: 'Sunrise hike',
          date: '2026-10-16T08:00:00.000Z',
          status: 'published',
          tenantId: 't1',
          hostUserId: 'host-1',
          hostId: 'host-1',
        } as never,
      ],
      joinRequests: [],
      hostedActivities: [
        {
          id: 'a-host',
          title: 'Camp night',
          date: '2026-10-17',
          status: 'published',
          tenantId: 't1',
          hostUserId: 'me',
          hostId: 'me',
        } as never,
      ],
      exploreItems: [
        {
          id: 'map-1',
          kind: 'hiking',
          source: 'buddy',
          title: 'Wadi walk',
          latitude: 1,
          longitude: 2,
          path: '/activity/a-public',
          date: '2026-10-15',
        } as never,
      ],
      viewerUserId: 'me',
      activityHref: (id) => `/activity/${id}`,
      exploreItemHref: (item) => item.path,
    });

    expect(markers.get('2026-10-15')).toMatchObject({
      available: true,
      outings: 1,
    });
    expect(markers.get('2026-10-16')).toMatchObject({ joined: true });
    expect(markers.get('2026-10-17')).toMatchObject({ hosting: true });
    expect(details.get('2026-10-15')?.some((d) => d.kind === 'available')).toBe(true);
    expect(details.get('2026-10-15')?.some((d) => d.kind === 'outing')).toBe(true);
  });
});
