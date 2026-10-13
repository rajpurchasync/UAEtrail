import { describe, expect, it } from 'vitest';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { buildUpcomingPlanRows } from './activityHubSections';

const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

const baseActivity = (id: string, date: string): MyActivityDTO => ({
  id,
  tenantId: 't1',
  tenantSlug: 'host',
  locationId: 'loc',
  locationName: 'Dubai',
  activityType: 'hiking',
  title: `Plan ${id}`,
  description: 'Test',
  date,
  time: '09:00',
  price: 0,
  slotsTotal: 10,
  slotsAvailable: 5,
  status: 'published',
  participation: {
    participantId: 'p1',
    requestId: 'r1',
    status: 'confirmed',
    canCheckIn: false,
  },
});

const baseRequest = (
  id: string,
  activityId: string,
  date: string,
  status: ActivityRequestView['status']
): ActivityRequestView => ({
  id,
  status,
  note: undefined,
  organizerNote: undefined,
  cancelReason: null,
  cancelMessage: null,
  cancelledAt: null,
  createdAt: new Date().toISOString(),
  activity: {
    id: activityId,
    title: `Request ${id}`,
    locationName: 'Dubai',
    date,
    startAt: `${date}T09:00:00.000Z`,
  },
});

describe('buildUpcomingPlanRows', () => {
  it('merges confirmed participations and pending requests sorted by date', () => {
    const d1 = futureDate();
    const d2 = new Date();
    d2.setDate(d2.getDate() + 14);
    const later = d2.toISOString().slice(0, 10);

    const rows = buildUpcomingPlanRows(
      [baseActivity('a1', later), baseActivity('a2', d1)],
      [baseRequest('r1', 'a9', d1, 'pending')]
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]?.kind).toBe('confirmed');
    expect(rows[0]?.kind === 'confirmed' && rows[0].activity.id).toBe('a2');
    expect(rows[1]?.kind).toBe('requested');
    expect(rows[2]?.kind === 'confirmed' && rows[2].activity.id).toBe('a1');
  });

  it('drops pending requests when participation already exists for that activity', () => {
    const date = futureDate();
    const rows = buildUpcomingPlanRows(
      [baseActivity('a1', date)],
      [baseRequest('r1', 'a1', date, 'pending')]
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe('confirmed');
  });
});
