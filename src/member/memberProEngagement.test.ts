import { describe, expect, it } from 'vitest';
import {
  memberHasUnlimitedDiscovery,
  viewerMayBrowsePublicMemberDirectory,
  viewerMaySeeProfileViewStats,
} from '@uaetrail/shared-types';

describe('member Pro engagement gates', () => {
  it('allows any signed-in member to list discover directory', () => {
    expect(viewerMayBrowsePublicMemberDirectory({ viewerUserId: null })).toBe(false);
    expect(viewerMayBrowsePublicMemberDirectory({ viewerUserId: 'u1' })).toBe(true);
  });

  it('limits profile view stats to host Pro / business', () => {
    expect(
      viewerMaySeeProfileViewStats({
        viewerUserId: 'u1',
        hostStatus: { hostTiers: { community: true, professional: false, business: false } },
      })
    ).toBe(false);
    expect(
      viewerMaySeeProfileViewStats({
        viewerUserId: 'u1',
        hostStatus: { hostTiers: { community: true, professional: true, business: false } },
      })
    ).toBe(true);
  });

  it('unlimited discovery for pro/business tiers', () => {
    expect(
      memberHasUnlimitedDiscovery({
        hostTiers: { community: true, professional: false, business: false },
      })
    ).toBe(false);
    expect(
      memberHasUnlimitedDiscovery({
        hostTiers: { community: false, professional: false, business: true },
      })
    ).toBe(true);
  });
});
