import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  filterEligibleSelfRideshares,
  mergeEligibleRideshareParents,
} from './eligibleRideshareParentActivities';

const activity = (overrides: Partial<ActivityDTO>): ActivityDTO =>
  ({
    id: 'a1',
    tenantId: 't1',
    locationId: 'loc',
    activityType: 'event',
    title: 'Sunset run',
    description: '',
    date: '2099-01-12',
    time: '17:00',
    price: 0,
    slotsTotal: 8,
    slotsAvailable: 8,
    status: 'published',
    ...overrides,
  }) as ActivityDTO;

describe('mergeEligibleRideshareParents', () => {
  it('keeps joined and hosted hikes/camps/events, drops rideshares and drafts', () => {
    const rows = mergeEligibleRideshareParents({
      hosted: [
        activity({ id: 'h1', title: 'Host hike', activityType: 'hiking' }),
        activity({ id: 'h2', title: 'Draft camp', activityType: 'camping', status: 'draft' }),
        activity({ id: 'h3', title: 'Host ride', activityType: 'rideshare' }),
      ],
      joined: [
        activity({ id: 'j1', title: 'Joined event', activityType: 'event' }),
        activity({ id: 'h1', title: 'Host hike dup', activityType: 'hiking' }),
      ],
      excludeActivityId: 'skip',
    });
    expect(rows.map((row) => row.id)).toEqual(['h1', 'j1']);
    expect(rows[0]?.relation).toBe('hosting');
    expect(rows[1]?.relation).toBe('joined');
  });

  it('excludes the newly created ride id', () => {
    const rows = mergeEligibleRideshareParents({
      hosted: [activity({ id: 'ride-1', activityType: 'event' })],
      joined: [],
      excludeActivityId: 'ride-1',
    });
    expect(rows).toEqual([]);
  });
});

describe('filterEligibleSelfRideshares', () => {
  it('keeps unlinked published rides and rides already on this parent', () => {
    const rows = filterEligibleSelfRideshares(
      [
        activity({ id: 'r1', title: 'Dawn ride', activityType: 'rideshare' }),
        activity({
          id: 'r2',
          title: 'Other outing ride',
          activityType: 'rideshare',
          linkedActivityId: 'other-event',
        }),
        activity({ id: 'r3', title: 'Draft ride', activityType: 'rideshare', status: 'draft' }),
        activity({
          id: 'r4',
          title: 'Already on parent',
          activityType: 'rideshare',
          linkedActivityId: 'event-1',
        }),
      ],
      'event-1'
    );
    expect(rows.map((row) => row.id)).toEqual(['r1', 'r4']);
  });
});
