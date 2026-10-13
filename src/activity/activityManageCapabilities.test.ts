import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityManageCapabilities } from './activityManageCapabilities';

const base = (overrides: Partial<ActivityDTO>): ActivityDTO =>
  ({
    id: 'a1',
    title: 'Test',
    activityType: 'hiking',
    status: 'published',
    date: '2026-12-01',
    participationMode: 'approval',
    ...overrides,
  }) as ActivityDTO;

describe('activityManageCapabilities', () => {
  it('enables link rideshare for published hike when Pro entitlements allow', () => {
    const caps = activityManageCapabilities(base({ activityType: 'hiking' }), {
      canAddLinkedRide: true,
    });
    expect(caps.showLinkRideshare).toBe(true);
    expect(caps.showJoinRequests).toBe(true);
    expect(caps.showGroupChat).toBe(true);
  });

  it('disables link rideshare without canAddLinkedRide', () => {
    const caps = activityManageCapabilities(base({ activityType: 'hiking' }));
    expect(caps.showLinkRideshare).toBe(false);
  });

  it('disables link rideshare for rideshare activity', () => {
    const caps = activityManageCapabilities(base({ activityType: 'rideshare' }), {
      canAddLinkedRide: true,
    });
    expect(caps.showLinkRideshare).toBe(false);
    expect(caps.showGroupChat).toBe(true);
  });
});
