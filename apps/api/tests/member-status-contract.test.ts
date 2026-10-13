import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMemberStatusDto } from '@uaetrail/shared-types';

describe('member status contract', () => {
  it('registers only GET /me/status (legacy paths rewritten — no parallel routes)', () => {
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
    expect(index).toMatch(/legacyMemberStatusPathRewrite/);
  });

  it('nests publish capabilities under publish on /me/status wire', () => {
    const dto = buildMemberStatusDto({
      signupProfileComplete: true,
      isCommunityHost: false,
      hostTiers: { community: true, professional: false, business: false },
      profileRoleLabel: 'community_member',
      canPublish: true,
      canAccessHostConsole: true,
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
    expect(dto.publish.canAccessPublishingWorkspace).toBe(true);
    expect(dto.canPublish).toBe(true);
    expect(dto.profileComplete).toBe(true);
    expect(dto.signupProfileComplete).toBe(true);
  });
});
