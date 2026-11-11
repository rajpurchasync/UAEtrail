import { UserRole } from './enums.js';
import type { HostTierFlags, MemberProfileRoleLabel } from '@uaetrail/shared-types';

export const resolveMemberProfileRoleLabel = (input: {
  role: UserRole;
  hostTiers: HostTierFlags;
  isCommunityHost: boolean;
  hasAgencyProfile: boolean;
  hasShopProfile: boolean;
}): MemberProfileRoleLabel => {
  if (input.role === UserRole.PLATFORM_ADMIN) return 'platform_staff';
  if (input.hasShopProfile) return 'shop_owner';
  if (input.hasAgencyProfile || input.hostTiers.business) return 'agency';
  if (input.hostTiers.professional) return 'professional_guide';
  if (input.isCommunityHost || input.hostTiers.community) return 'host';
  return 'community_member';
};
