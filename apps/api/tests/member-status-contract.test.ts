import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMemberStatusDto } from '@uaetrail/shared-types';

describe('member status contract', () => {
  it('registers only GET /me/status (no parallel legacy status routes)', () => {
    const routes = readFileSync(
      join(process.cwd(), 'src/routes/user/registerMemberStatusRoutes.ts'),
      'utf8'
    );
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(routes).toMatch(/['"]\/me\/status['"]/);
    expect(routes).not.toMatch(/['"]\/me\/operator-status['"]/);
    expect(routes).not.toMatch(/['"]\/me\/host-status['"]/);
    expect(routes).toMatch(/resolveMemberStatus/);
    expect(routes).toMatch(/buildMemberStatusDto/);
    expect(index).not.toMatch(/legacyMemberStatusPathRewrite/);
  });

  it('nests publish capabilities under publish on /me/status wire (no flat duplicate)', () => {
    const dto = buildMemberStatusDto({
      profileComplete: true,
      guideProfileComplete: true,
      medicalSafetyProfileComplete: true,
      isCommunityHost: false,
      hostTiers: { community: true, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canPublish: true,
      canAccessOperatorWorkspace: true,
      isPlatformStaff: false,
      applicationStatus: 'none',
      tenantId: 't1',
      isHostRole: false,
      hasTenant: true,
      tenantType: 'guide_owned',
      businessMode: null,
      canHostPaidActivities: false,
      hasGuideProfile: false,
      hasAgencyProfile: false,
      hasShopProfile: false,
      ownedProfiles: [],
    });
    expect(dto.publish.canPublish).toBe(true);
    expect(dto.publish.canAccessOperatorWorkspace).toBe(true);
    expect(dto.publish.isPlatformStaff).toBe(false);
    expect(dto.profileComplete).toBe(true);
    expect(dto.guideProfileComplete).toBe(true);
    expect(dto.profileRoleLabel).toBe('community_member');
    expect('canPublish' in dto).toBe(false);
    expect('signupProfileComplete' in dto).toBe(false);
    expect('tenantId' in dto).toBe(false);
    expect('isHostRole' in dto).toBe(false);
    expect('isPlatformStaff' in dto).toBe(false);
  });

  it('exposes isPlatformStaff under publish (DMCP Phase 1)', () => {
    const dto = buildMemberStatusDto({
      profileComplete: true,
      guideProfileComplete: true,
      medicalSafetyProfileComplete: true,
      isCommunityHost: false,
      hostTiers: { community: false, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canPublish: true,
      canAccessOperatorWorkspace: true,
      isPlatformStaff: true,
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
    expect(dto.publish.isPlatformStaff).toBe(true);
  });
});
