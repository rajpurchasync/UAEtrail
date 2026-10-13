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
      signupProfileComplete: false,
      canPublish: false,
      isCommunityHost: false,
      hostTiers: { community: false, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canAccessHostConsole: false,
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

  it('allows when profile complete and canPublish', async () => {
    mockedStatus.mockResolvedValue({
      signupProfileComplete: true,
      canPublish: true,
      isCommunityHost: false,
      hostTiers: { community: true, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canAccessHostConsole: true,
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
});
