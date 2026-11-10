import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/services/member-status.js', () => ({
  resolveMemberStatus: vi.fn(),
}));

import { resolveMemberStatus } from '../src/services/member-status.js';
import { assertMemberCanPublishActivities } from '../src/services/member-publish-gate.js';

const mockedStatus = vi.mocked(resolveMemberStatus);

describe('assertMemberCanPublishActivities', () => {
  beforeEach(() => {
    mockedStatus.mockReset();
  });

  it('skips check for platform admin', async () => {
    await assertMemberCanPublishActivities('user-1', { platformAdmin: true });
    expect(mockedStatus).not.toHaveBeenCalled();
  });

  it('rejects incomplete profile', async () => {
    mockedStatus.mockResolvedValue({
      profileComplete: false,
      canPublish: false,
      isCommunityHost: false,
      hostTiers: { community: false, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canAccessPublishingWorkspace: false,
      applicationStatus: 'none',
      tenantId: null,
      isHostRole: false,
      hasTenant: false,
      tenantType: null,
      businessMode: null,
      canHostPaidActivities: false,
      hasGuideProfile: false,
      hasAgencyProfile: false,
      hasShopProfile: false,
      ownedProfiles: [],
    });

    await expect(assertMemberCanPublishActivities('user-1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'profile_incomplete',
    });
  });

  it('rejects paid publish without canHostPaidActivities', async () => {
    mockedStatus.mockResolvedValue({
      profileComplete: true,
      canPublish: true,
      isCommunityHost: true,
      hostTiers: { community: true, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canAccessPublishingWorkspace: true,
      applicationStatus: 'none',
      tenantId: 'tenant-1',
      isHostRole: true,
      hasTenant: true,
      tenantType: 'guide_owned',
      businessMode: null,
      canHostPaidActivities: false,
      hasGuideProfile: true,
      hasAgencyProfile: false,
      hasShopProfile: false,
      ownedProfiles: [],
    });

    await expect(
      assertMemberCanPublishActivities('user-1', { pricingMode: 'paid' })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'paid_publish_not_allowed',
    });
  });

  it('allows when profile complete and canPublish', async () => {
    mockedStatus.mockResolvedValue({
      profileComplete: true,
      canPublish: true,
      isCommunityHost: false,
      hostTiers: { community: true, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canAccessPublishingWorkspace: true,
      applicationStatus: 'none',
      tenantId: 'tenant-1',
      isHostRole: true,
      hasTenant: true,
      tenantType: 'guide_owned',
      businessMode: null,
      canHostPaidActivities: false,
      hasGuideProfile: true,
      hasAgencyProfile: false,
      hasShopProfile: false,
      ownedProfiles: [],
    });

    await expect(assertMemberCanPublishActivities('user-1')).resolves.toBeUndefined();
  });

  it('allows paid publish when canHostPaidActivities', async () => {
    mockedStatus.mockResolvedValue({
      profileComplete: true,
      canPublish: true,
      isCommunityHost: true,
      hostTiers: { community: true, professional: false, business: true },
      profileRoleLabel: 'business',
      canAccessPublishingWorkspace: true,
      applicationStatus: 'none',
      tenantId: 'tenant-1',
      isHostRole: true,
      hasTenant: true,
      tenantType: 'agency',
      businessMode: 'agency',
      canHostPaidActivities: true,
      hasGuideProfile: false,
      hasAgencyProfile: true,
      hasShopProfile: false,
      ownedProfiles: [],
    });

    await expect(
      assertMemberCanPublishActivities('user-1', { pricingMode: 'paid' })
    ).resolves.toBeUndefined();
  });
});
