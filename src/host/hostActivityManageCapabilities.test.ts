import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { hostActivityManageCapabilities } from './hostActivityManageCapabilities';

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

describe('hostActivityManageCapabilities', () => {
  it('enables link rideshare for published hike when Pro entitlements allow', () => {
    const caps = hostActivityManageCapabilities(base({ activityType: 'hiking' }), {
      canAddLinkedRide: true,
    });
    expect(caps.showLinkRideshare).toBe(true);
    expect(caps.showJoinRequests).toBe(true);
    expect(caps.showGroupChat).toBe(true);
  });

  it('disables link rideshare without canAddLinkedRide', () => {
    const caps = hostActivityManageCapabilities(base({ activityType: 'hiking' }));
    expect(caps.showLinkRideshare).toBe(false);
  });

  it('disables link rideshare for rideshare activity', () => {
    const caps = hostActivityManageCapabilities(base({ activityType: 'rideshare' }), {
      canAddLinkedRide: true,
    });
    expect(caps.showLinkRideshare).toBe(false);
    expect(caps.showGroupChat).toBe(true);
  });
});
