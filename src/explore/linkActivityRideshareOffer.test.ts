import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  canLinkRideshareToActivity,
  resolveSeekingParentActivityId,
} from './linkActivityRideshareOffer';
import { seekingExploreMapItem } from './exploreMapItemFixtures';

const baseActivity = (overrides: Partial<ActivityDTO> = {}): ActivityDTO =>
  ({
    id: 'a1',
    tenantId: 't1',
    locationId: 'loc',
    activityType: 'hiking',
    title: 'Sunrise hike',
    description: '',
    date: '2026-09-12',
    time: '06:00',
    price: 0,
    slotsTotal: 8,
    slotsAvailable: 8,
    status: 'published',
    ...overrides,
  }) as ActivityDTO;

describe('canLinkRideshareToActivity', () => {
  it('allows optional carpool link on published hiking, camping, and events (incl. FLOW-05)', () => {
    expect(canLinkRideshareToActivity(baseActivity({ activityType: 'hiking' }))).toBe(true);
    expect(canLinkRideshareToActivity(baseActivity({ activityType: 'camping' }))).toBe(true);
    expect(canLinkRideshareToActivity(baseActivity({ activityType: 'event' }))).toBe(true);
  });

  it('blocks carpool link on rideshare activities only', () => {
    expect(canLinkRideshareToActivity(baseActivity({ activityType: 'rideshare' }))).toBe(false);
    expect(
      canLinkRideshareToActivity(baseActivity({ linkedRideshareActivityId: 'ride-1' }))
    ).toBe(true);
    expect(canLinkRideshareToActivity(null)).toBe(false);
  });
});

describe('resolveSeekingParentActivityId', () => {
  it('reads parent id from nested activity or activity: wire id', () => {
    const item = seekingExploreMapItem({
      intentId: 'int-1',
      activityId: 'act-seek-1',
      activity: { id: 'act-seek-1', title: 'Crew', activityType: 'hiking' },
    });
    expect(resolveSeekingParentActivityId(item)).toBe('act-seek-1');
    expect(
      resolveSeekingParentActivityId({
        ...item,
        activity: undefined,
        id: 'activity:act-wire-only',
      } as typeof item)
    ).toBe('act-wire-only');
  });
});
