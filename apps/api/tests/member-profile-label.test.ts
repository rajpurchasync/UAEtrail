import { describe, expect, it } from 'vitest';
import { UserRole } from '../src/domain/enums.js';
import { resolveHostTiersFromTenants } from '../src/domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../src/domain/member-profile-label.js';
import { TenantBusinessMode, TenantType } from '../src/domain/enums.js';

describe('resolveMemberProfileRoleLabel', () => {
  const baseTiers = { community: true, professional: false, business: false };

  it('prefers shop and agency over community host', () => {
    expect(
      resolveMemberProfileRoleLabel({
        role: UserRole.PARTICIPANT,
        hostTiers: baseTiers,
        isCommunityHost: true,
        hasAgencyProfile: false,
        hasShopProfile: true,
      })
    ).toBe('shop_owner');
  });

  it('labels community host after first post', () => {
    expect(
      resolveMemberProfileRoleLabel({
        role: UserRole.PARTICIPANT,
        hostTiers: baseTiers,
        isCommunityHost: true,
        hasAgencyProfile: false,
        hasShopProfile: false,
      })
    ).toBe('host');
  });

  it('labels buddy host when community tier is enabled', () => {
    expect(
      resolveMemberProfileRoleLabel({
        role: UserRole.PARTICIPANT,
        hostTiers: baseTiers,
        isCommunityHost: false,
        hasAgencyProfile: false,
        hasShopProfile: false,
      })
    ).toBe('host');
  });

  it('defaults to community_member', () => {
    expect(
      resolveMemberProfileRoleLabel({
        role: UserRole.PARTICIPANT,
        hostTiers: { community: false, professional: false, business: false },
        isCommunityHost: false,
        hasAgencyProfile: false,
        hasShopProfile: false,
      })
    ).toBe('community_member');
  });
});

describe('resolveHostTiersFromTenants', () => {
  it('marks community tier when profile complete and buddy tenant present', () => {
    const tiers = resolveHostTiersFromTenants(
      [{ type: TenantType.GUIDE_OWNED, publishingPurpose: 'community' }],
      true
    );
    expect(tiers.community).toBe(true);
    expect(tiers.business).toBe(false);
  });

  it('detects business shop tenant', () => {
    const tiers = resolveHostTiersFromTenants(
      [
        {
          type: TenantType.GUIDE_OWNED,
          businessMode: TenantBusinessMode.SHOP,
          publishingPurpose: 'business',
        },
      ],
      true
    );
    expect(tiers.business).toBe(true);
  });
});
