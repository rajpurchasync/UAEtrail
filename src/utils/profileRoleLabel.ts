import type { OwnedOrganisationProfileDTO, UserRole } from '@uaetrail/shared-types';

export const resolveProfileOrganisationKind = (
  ownedProfiles: OwnedOrganisationProfileDTO[]
): 'shop' | 'agency' | 'guide' | null => {
  if (ownedProfiles.some((profile) => profile.type === 'shop')) return 'shop';
  if (ownedProfiles.some((profile) => profile.type === 'agency')) return 'agency';
  if (ownedProfiles.some((profile) => profile.type === 'guide')) return 'guide';
  return null;
};

/** @deprecated Use resolveProfileOrganisationKind */
export const resolveProfileHostKind = resolveProfileOrganisationKind;

export const resolvePublicMemberRoleLabel = (profile: {
  isHost: boolean;
  isGuideStaff?: boolean;
  hostProfileKind: 'shop' | 'agency' | 'guide' | null;
}): string => {
  if (profile.hostProfileKind === 'shop') return 'Shop owner';
  if (profile.hostProfileKind === 'agency') return 'Agency';
  if (profile.isGuideStaff) return 'Guide';
  if (profile.isHost) return 'Guide';
  return 'Community member';
};

export const resolveProfileRoleLabel = (
  role: UserRole | undefined,
  ownedProfiles: OwnedOrganisationProfileDTO[]
): string => {
  const hostKind = resolveProfileOrganisationKind(ownedProfiles);
  if (hostKind === 'shop') return 'Shop owner';
  if (hostKind === 'agency') return 'Agency';
  if (hostKind === 'guide') return 'Guide';
  if (role === 'tenant_guide') return 'Guide';
  if (role === 'tenant_owner' || role === 'tenant_admin') return 'Explorer';
  if (role === 'participant') return 'Community member';
  return 'Explorer';
};
