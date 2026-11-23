import { TenantBusinessMode, TenantType, UserRole } from '../domain/enums.js';
import { resolveHostTiersFromTenants } from '../domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { wireMemberDisplayName } from '../domain/person-name.js';
import { isGuideProfileComplete } from '@uaetrail/shared-types';
import { resolveOwnedProfileType } from '../lib/tenant-store.js';
import type {
  MemberProfileRoleLabel,
  ProfileFieldPrivacyKey,
  ProfileViewerAccessLevel,
  RideshareVehiclePublicDTO,
} from '@uaetrail/shared-types';
import {
  canViewProfileField,
  computeProfileDetailExposure,
  hostBrandProfilePath,
  inferHostStorefrontKindFromTenantWire,
  mergeProfileDateOfBirthShare,
  mergeProfileFieldPrivacy,
  resolveMemberCardDateOfBirth,
  shopPublicPath,
} from '@uaetrail/shared-types';
import type { ProfileViewerAccessDTO } from '@uaetrail/shared-types';
import { findAuthUserById, type AuthUserRecord } from '../lib/auth-users-store.js';
import {
  countPublishedActivitiesHostedByUser,
  countUserCheckedInParticipations,
} from '../lib/activity-engagement-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { listActiveTenantMembershipsByUser } from '../lib/tenant-access.js';
import { listTenantsByOwnerId, pickActivityTenant, type TenantRecord } from '../lib/tenant-store.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import {
  USER_CITY_LABELS,
  type UserCity,
} from '../domain/user-profile.js';
import {
  GUEST_MEMBER_PROFILE_MESSAGE,
  PRIVATE_PROFILE_MESSAGE,
  resolveProfileViewerAccess,
} from './profile-viewer-access.js';
import { getMemberGoalPublicSnapshot } from '../lib/member-goals-store.js';
import { getMemberAvailabilityPublicSnapshot } from '../lib/member-availability-store.js';
import { countActiveFixedAvailabilityMapSlotsForUser } from '../lib/member-availability-store.js';
import type { MemberAvailabilityPublicDTO, MemberGoalPublicDTO } from '@uaetrail/shared-types';
import { resolveFindCrewViewerRelation } from '../lib/find-crew-visibility-gate.js';
import { listPublicMemberBadges } from './member-badges.js';
import { listMemberVehicles } from '../lib/member-vehicles-store.js';

const computeAgeFromDateOfBirth = (dateOfBirth: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const parseMemberDetails = (
  metadata: unknown,
  profileDateOfBirth: string | null,
  profileLanguages: string | null
) => {
  if (!metadata || typeof metadata !== 'object') {
    return {
      age: profileDateOfBirth ? computeAgeFromDateOfBirth(profileDateOfBirth) : null,
      languages: profileLanguages?.trim() ? profileLanguages.trim() : null,
    };
  }
  const meta = metadata as Record<string, unknown>;
  const metadataDateOfBirth = typeof meta.dateOfBirth === 'string' ? meta.dateOfBirth : null;
  const dateOfBirth = profileDateOfBirth ?? metadataDateOfBirth;
  const metaLanguages = typeof meta.languages === 'string' && meta.languages.trim() ? meta.languages.trim() : null;
  const languages = profileLanguages?.trim() ? profileLanguages.trim() : metaLanguages;
  return {
    age: dateOfBirth ? computeAgeFromDateOfBirth(dateOfBirth) : null,
    languages,
  };
};

const resolveHostProfileKind = (
  tenant: { type: TenantType; businessMode?: TenantBusinessMode | null } | null
): 'shop' | 'agency' | 'guide' | null => {
  if (!tenant) return null;
  if (tenant.businessMode === TenantBusinessMode.SHOP) return 'shop';
  if (tenant.type === TenantType.COMPANY) return 'agency';
  if (tenant.type === TenantType.GUIDE_OWNED) return 'guide';
  return null;
};

const pickBusinessOperatorTenant = (tenants: TenantRecord[]): TenantRecord | null => {
  for (const tenant of tenants) {
    const ownedType = resolveOwnedProfileType(tenant);
    if (ownedType === 'agency' || ownedType === 'shop') return tenant;
  }
  return null;
};

const mergeLinkedTenants = (
  ownedTenants: TenantRecord[],
  memberships: Array<{ tenant: TenantRecord }>
): TenantRecord[] => {
  const seen = new Set<string>();
  const merged: TenantRecord[] = [];
  for (const tenant of ownedTenants) {
    if (seen.has(tenant.id)) continue;
    seen.add(tenant.id);
    merged.push(tenant);
  }
  for (const membership of memberships) {
    if (seen.has(membership.tenant.id)) continue;
    seen.add(membership.tenant.id);
    merged.push(membership.tenant);
  }
  return merged;
};

const resolveHostProfilePath = (tenant: TenantRecord | null): string | null => {
  if (!tenant) return null;
  if (resolveOwnedProfileType(tenant) === 'shop') {
    return shopPublicPath({ slug: tenant.slug });
  }
  return hostBrandProfilePath(
    tenant.slug,
    inferHostStorefrontKindFromTenantWire({
      type: tenant.type,
      businessMode: tenant.businessMode,
      publishingPurpose: tenant.publishingPurpose,
    })
  );
};

const toProfileAccessLevel = (level: string): ProfileViewerAccessLevel => {
  if (level === 'self') return 'self';
  if (level === 'platform_admin') return 'platform_admin';
  if (level === 'public') return 'public';
  if (level === 'group_member') return 'group_member';
  if (level === 'accepted_friend') return 'accepted_friend';
  if (level === 'activity_participant') return 'activity_participant';
  if (level === 'host_of_activity') return 'host_of_activity';
  return 'denied';
};

export type PublicMemberProfileData =
  | {
      visibilityState: 'private';
      id: string;
      message: string;
    }
  | {
      visibilityState: 'full';
      id: string;
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
      city: string | null;
      languages: string | null;
      age: number | null;
      birthYear: number | null;
      /** `MM-DD` when the member shares day+month only (no year). */
      monthDay: string | null;
      dateOfBirth: string | null;
      memberSince: string;
      isHost: boolean;
      profileRoleLabel: MemberProfileRoleLabel;
      isGuideStaff?: boolean;
      hostProfileKind: 'shop' | 'agency' | 'guide' | null;
      /** Public shop or agency profile URL when member is linked to a business operator. */
      operatorProfilePath: string | null;
      /** Business operator display name — pairs with `operatorProfilePath` (agency / shop only). */
      linkedOperatorName: string | null;
      /** Community / guide publishing tenant — host reviews and ratings attach here. */
      publishingTenantId: string | null;
      badges: Array<{
        key: string;
        name: string;
        description: string;
        emoji: string;
        earned: boolean;
        earnedAt: string | null;
      }>;
      stats: {
        activitiesAttended: number;
        activitiesHosted: number;
      } | null;
      vehicles: RideshareVehiclePublicDTO[] | null;
      yearGoal: MemberGoalPublicDTO | null;
      availability: MemberAvailabilityPublicDTO | null;
    };

export type PublicMemberProfileBuildInput = {
  viewerUserId?: string | null;
  isPlatformAdmin?: boolean;
  /** Owner preview — show signed-in public card, not self full detail. */
  previewAsPublic?: boolean;
  /** Skip duplicate auth user read when the caller already loaded the target. */
  preloadedUser?: AuthUserRecord | null;
};

export type PublicMemberProfileResult = {
  data: PublicMemberProfileData;
  viewerAccess: ProfileViewerAccessDTO;
};

export async function buildPublicMemberProfile(
  userId: string,
  input: PublicMemberProfileBuildInput = {}
): Promise<PublicMemberProfileResult | null> {
  const user =
    input.preloadedUser && input.preloadedUser._id === userId
      ? input.preloadedUser
      : await findAuthUserById(userId);
  if (!user) return null;

  const visibility = normalizeProfileVisibility(user.profile?.profileVisibility);
  const profileVisibility =
    visibility === 'group_members' ? 'group_members' : visibility === 'private' ? 'private' : 'public';

  const access = await resolveProfileViewerAccess({
    viewerUserId: input.viewerUserId ?? null,
    targetUserId: userId,
    targetVisibility: visibility,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const accessLevel = toProfileAccessLevel(access.level);
  const viewerUserId = input.viewerUserId ?? null;

  let viewerAccess = computeProfileDetailExposure({
    profileVisibility,
    level: accessLevel,
    viewerUserId,
  });

  if (input.previewAsPublic && viewerUserId === userId) {
    viewerAccess = computeProfileDetailExposure({
      profileVisibility,
      level: 'public',
      viewerUserId,
    });
  }

  if (viewerAccess.exposure === 'none') {
    const message = !viewerUserId ? GUEST_MEMBER_PROFILE_MESSAGE : PRIVATE_PROFILE_MESSAGE;
    return {
      data: {
        visibilityState: 'private',
        id: user._id,
        message,
      },
      viewerAccess,
    };
  }

  const [
    activitiesAttended,
    activitiesHosted,
    demandPosts,
    ownedTenants,
    tenantMemberships,
    hostApplication,
    yearGoal,
    badges,
    availability,
  ] = await Promise.all([
    countUserCheckedInParticipations(userId),
    countPublishedActivitiesHostedByUser(userId),
    countActiveFixedAvailabilityMapSlotsForUser(userId),
    listTenantsByOwnerId(userId),
    listActiveTenantMembershipsByUser(userId),
    findLatestHostApplicationByApplicant(userId),
    getMemberGoalPublicSnapshot(userId),
    listPublicMemberBadges(userId),
    getMemberAvailabilityPublicSnapshot(userId, viewerUserId ?? null),
  ]);

  const linkedTenants = mergeLinkedTenants(ownedTenants, tenantMemberships);
  const businessOperatorTenant = pickBusinessOperatorTenant(linkedTenants);
  const publishingTenant = pickActivityTenant(linkedTenants);
  const hostProfileKind = businessOperatorTenant
    ? resolveHostProfileKind(businessOperatorTenant)
    : null;
  const guideProfileComplete = isGuideProfileComplete(user.profile);
  const hostTiers = resolveHostTiersFromTenants(linkedTenants, guideProfileComplete);
  const hasAgencyProfile = linkedTenants.some((t) => resolveOwnedProfileType(t) === 'agency');
  const hasShopProfile = linkedTenants.some((t) => resolveOwnedProfileType(t) === 'shop');
  const isCommunityHost = activitiesHosted > 0 || demandPosts > 0;
  const profileRoleLabel = resolveMemberProfileRoleLabel({
    role: user.role,
    hostTiers,
    isCommunityHost,
    hasAgencyProfile,
    hasShopProfile,
  });
  const isHost = profileRoleLabel !== 'community_member';
  const isGuideStaff = user.role === UserRole.TENANT_GUIDE;

  const memberDetails = parseMemberDetails(
    hostApplication?.metadata,
    user.profile?.dateOfBirth ?? null,
    user.profile?.languages ?? null
  );
  const profileCity = user.profile?.city ?? null;

  const fieldPrivacy = mergeProfileFieldPrivacy(user.profile?.fieldPrivacy);
  const storedAgeAudience = (
    user.profile?.fieldPrivacy as { age?: 'hidden' | 'friends' | 'public' } | null | undefined
  )?.age;
  const dateOfBirthShare = mergeProfileDateOfBirthShare(
    user.profile?.dateOfBirthShare,
    storedAgeAudience ?? null
  );
  const exposure = viewerAccess.exposure;
  const isSelf = accessLevel === 'self' || Boolean(input.previewAsPublic && viewerUserId === userId);
  const networkRelation = isSelf
    ? ('self' as const)
    : await resolveFindCrewViewerRelation(viewerUserId, userId);
  const fieldVisible = (key: ProfileFieldPrivacyKey) =>
    canViewProfileField(fieldPrivacy[key], exposure, isSelf, networkRelation);
  const dobSlice = resolveMemberCardDateOfBirth({
    dateOfBirth: user.profile?.dateOfBirth ?? null,
    share: dateOfBirthShare,
    exposure,
    isSelf,
    relation: networkRelation,
  });
  const earnedBadges = badges.filter((b) => b.earned);

  let visibleBadges = badges;
  if (!fieldVisible('badges')) {
    visibleBadges = [];
  } else if (exposure !== 'full') {
    visibleBadges = earnedBadges;
  }

  let vehicles: RideshareVehiclePublicDTO[] | null = null;
  if (fieldVisible('vehicles')) {
    const garage = await listMemberVehicles(userId);
    const showPlate = fieldVisible('vehiclePlate');
    vehicles = garage.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      year: vehicle.year,
      ...(showPlate ? { plateNumber: vehicle.plateNumber } : {}),
    }));
  }

  const data: Extract<PublicMemberProfileData, { visibilityState: 'full' }> = {
    visibilityState: 'full',
    id: user._id,
    displayName: wireMemberDisplayName({
      displayName: user.profile?.displayName,
      givenName: user.profile?.givenName,
      surname: user.profile?.surname,
      email: user.email,
    }),
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: fieldVisible('bio') ? user.profile?.bio ?? null : null,
    city: fieldVisible('city') && profileCity ? USER_CITY_LABELS[profileCity as UserCity] : null,
    age: dobSlice.age,
    birthYear: dobSlice.birthYear,
    monthDay: dobSlice.monthDay,
    dateOfBirth: dobSlice.dateOfBirth,
    memberSince: user.createdAt.toISOString(),
    languages: fieldVisible('languages') ? memberDetails.languages : null,
    isHost,
    profileRoleLabel,
    isGuideStaff,
    hostProfileKind,
    operatorProfilePath: businessOperatorTenant ? resolveHostProfilePath(businessOperatorTenant) : null,
    linkedOperatorName: businessOperatorTenant?.name?.trim() ? businessOperatorTenant.name.trim() : null,
    publishingTenantId: publishingTenant?.id ?? null,
    badges: visibleBadges,
    stats: fieldVisible('stats')
      ? {
          activitiesAttended,
          activitiesHosted,
        }
      : null,
    vehicles,
    yearGoal: fieldVisible('yearGoal') ? yearGoal : null,
    availability: fieldVisible('availability') ? availability : null,
  };

  return { data, viewerAccess };
}
