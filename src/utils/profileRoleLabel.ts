import type { MemberProfileRoleLabel, OwnedOrganisationProfileDTO, UserRole } from '@uaetrail/shared-types';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';

export const resolveProfileHostKind = (
  ownedProfiles: OwnedOrganisationProfileDTO[]
): 'shop' | 'agency' | 'guide' | null => {
  if (ownedProfiles.some((profile) => profile.type === 'shop')) return 'shop';
  if (ownedProfiles.some((profile) => profile.type === 'agency')) return 'agency';
  if (ownedProfiles.some((profile) => profile.type === 'guide')) return 'guide';
  return null;
};


export const resolvePublicMemberRoleLabel = (profile: {
  profileRoleLabel?: MemberProfileRoleLabel;
  isHost: boolean;
  isGuideStaff?: boolean;
  hostProfileKind: 'shop' | 'agency' | 'guide' | null;
}): string => {
  if (profile.profileRoleLabel) {
    return memberProfileRoleLabel(profile.profileRoleLabel);
  }
  if (profile.hostProfileKind === 'shop') return 'Shop owner';
  if (profile.hostProfileKind === 'agency') return 'Agency';
  if (profile.isGuideStaff) return 'Guide';
  if (profile.isHost) return 'Host';
  return 'Community member';
};

export const resolveProfileRoleLabel = (
  role: UserRole | undefined,
  ownedProfiles: OwnedOrganisationProfileDTO[],
  isCommunityHost = false
): string => {
  const hostKind = resolveProfileHostKind(ownedProfiles);
  if (hostKind === 'shop') return 'Shop owner';
  if (hostKind === 'agency') return 'Agency';
  if (isCommunityHost) return 'Host';
  if (hostKind === 'guide') return 'Guide';
  if (role === 'tenant_guide') return 'Guide';
  if (role === 'tenant_owner' || role === 'tenant_admin') return 'Explorer';
  if (role === 'participant') return 'Community member';
  return 'Explorer';
};
