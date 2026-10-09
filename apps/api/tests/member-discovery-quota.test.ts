import { describe, expect, it } from 'vitest';
import { buildMemberDiscoveryQuota, memberHasUnlimitedDiscovery } from '@uaetrail/shared-types';

describe('member discovery quota', () => {
  it('builds free tier quota', () => {
    expect(buildMemberDiscoveryQuota(2, false)).toEqual({
      windowDays: 30,
      limit: 3,
      used: 2,
      remaining: 1,
    });
    expect(buildMemberDiscoveryQuota(3, false).remaining).toBe(0);
  });

  it('unlimited for pro host tiers', () => {
    expect(
      memberHasUnlimitedDiscovery({
        hostTiers: { community: true, professional: true, business: false },
      })
    ).toBe(true);
    expect(buildMemberDiscoveryQuota(10, true).limit).toBeNull();
  });
});
