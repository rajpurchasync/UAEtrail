import type { OwnedHostProfileDTO, UserRole } from '@uaetrail/shared-types';

export const resolveProfileHostKind = (
  ownedProfiles: OwnedHostProfileDTO[]
): 'shop' | 'agency' | 'guide' | null => {
  if (ownedProfiles.some((profile) => profile.type === 'shop')) return 'shop';
  if (ownedProfiles.some((profile) => profile.type === 'agency')) return 'agency';
  if (ownedProfiles.some((profile) => profile.type === 'guide')) return 'guide';
  return null;
};

export const resolvePublicMemberRoleLabel = (profile: {
  isHost: boolean;
  isGuideStaff?: boolean;
  hostProfileKind: 'shop' | 'agency' | 'guide' | null;
}): string => {
  if (profile.hostProfileKind === 'shop') return 'Shop owner';
  if (profile.hostProfileKind === 'agency') return 'Agency host';
  if (profile.isGuideStaff) return 'Guide';
  if (profile.isHost) return 'Host';
  return 'Community member';
};

export const resolveProfileRoleLabel = (
  role: UserRole | undefined,
  ownedProfiles: OwnedHostProfileDTO[]
): string => {
  const hostKind = resolveProfileHostKind(ownedProfiles);
  if (hostKind === 'shop') return 'Shop owner';
  if (hostKind === 'agency') return 'Agency host';
  if (hostKind === 'guide') return 'Host';
  if (role === 'tenant_guide') return 'Guide';
  if (role === 'tenant_owner' || role === 'tenant_admin') return 'Explorer';
  if (role === 'participant') return 'Community member';
  return 'Explorer';
};
