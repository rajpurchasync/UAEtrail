import { describe, expect, it } from 'vitest';
import { buildPlanCalendarMaps, filterPlanCalendarByCommitment } from './planCalendarMarkers';

describe('buildPlanCalendarMaps', () => {
  it('marks availability, hosting, joined, and fixed map slots (no legacy seeking posts)', () => {
    const { markers, details } = buildPlanCalendarMaps({
      availabilitySlots: [
        { startDate: '2026-10-15', endDate: '2026-10-15' },
        {
          scheduleKind: 'fixed',
          startDate: '2026-10-18',
          endDate: '2026-10-18',
          title: 'Hatta crew',
          slotId: 'slot-1',
          latitude: 25.1,
          longitude: 55.2,
        },
      ],
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
      viewerUserId: 'me',
      activityHref: (id) => `/activity/${id}`,
      fixedAvailabilityManageHref: () => '/plan',
      hostingManageHref: (id) => `/plan?peek=${id}`,
    });

    expect(markers.get('2026-10-15')).toMatchObject({ available: true });
    expect(markers.get('2026-10-16')).toMatchObject({ joined: true });
    expect(markers.get('2026-10-17')).toMatchObject({ hosting: true });
    expect(markers.get('2026-10-18')).toMatchObject({ mapSlot: true });
    expect(details.get('2026-10-15')?.some((d) => d.kind === 'available')).toBe(true);
    const joinedRow = details.get('2026-10-16')?.find((d) => d.kind === 'joined');
    expect(joinedRow).toMatchObject({ activityId: 'a-join', title: 'Sunrise hike' });
    const crewRow = details.get('2026-10-18')?.find((d) => d.kind === 'mapSlot');
    expect(crewRow).toMatchObject({ title: 'Hatta crew', slotId: 'slot-1' });
  });

  it('filterPlanCalendarByCommitment scopes hosting vs joined', () => {
    const built = buildPlanCalendarMaps({
      availabilitySlots: [{ startDate: '2026-10-15', endDate: '2026-10-15' }],
      joinedActivities: [
        {
          id: 'a-join',
          title: 'Join',
          date: '2026-10-16',
          status: 'published',
          hostUserId: 'x',
        } as never,
      ],
      joinRequests: [],
      hostedActivities: [
        {
          id: 'a-host',
          title: 'Host',
          date: '2026-10-17',
          status: 'published',
          hostUserId: 'me',
        } as never,
      ],
      viewerUserId: 'me',
      activityHref: (id) => `/activity/${id}`,
      fixedAvailabilityManageHref: () => '/plan',
      hostingManageHref: (id) => `/plan?peek=${id}`,
    });

    const hosted = filterPlanCalendarByCommitment(built.markers, built.details, 'hosting');
    expect(hosted.details.has('2026-10-16')).toBe(false);
    expect(hosted.details.has('2026-10-17')).toBe(true);

    const joined = filterPlanCalendarByCommitment(built.markers, built.details, 'joined');
    expect(joined.details.has('2026-10-17')).toBe(false);
    expect(joined.details.has('2026-10-16')).toBe(true);
  });
});