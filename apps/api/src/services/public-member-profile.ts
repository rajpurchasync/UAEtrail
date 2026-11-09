import { TenantBusinessMode, TenantType, UserRole } from '../domain/enums.js';
import { resolveHostTiersFromTenants } from '../domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { resolveOwnedProfileType } from '../lib/tenant-store.js';
import type { MemberProfileRoleLabel, ProfileViewerAccessLevel } from '@uaetrail/shared-types';
import {
  computeProfileDetailExposure,
  hostBrandProfilePath,
  inferHostStorefrontKindFromTenantWire,
  shopPublicPath,
} from '@uaetrail/shared-types';
import type { ProfileViewerAccessDTO } from '@uaetrail/shared-types';
import { findAuthUserById } from '../lib/auth-users-store.js';
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
import { countParticipantIntentsByUser } from '../lib/participant-intents-store.js';
import type { MemberAvailabilityPublicDTO, MemberGoalPublicDTO } from '@uaetrail/shared-types';
import { listPublicMemberBadges } from './member-badges.js';

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
  if (level === 'accepted_buddy') return 'accepted_buddy';
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
      memberSince: string;
      isHost: boolean;
      profileRoleLabel: MemberProfileRoleLabel;
      isGuideStaff?: boolean;
      hostProfileKind: 'shop' | 'agency' | 'guide' | null;
      /** Public shop or agency profile URL when member is linked to a business operator. */
      hostProfilePath: string | null;
      /** Business operator display name — pairs with `hostProfilePath` (agency / shop only). */
      linkedOperatorName: string | null;
      /** Buddy / guide publishing tenant — host reviews and ratings attach here. */
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
      };
      yearGoal: MemberGoalPublicDTO | null;
      availability: MemberAvailabilityPublicDTO | null;
    };

export type PublicMemberProfileBuildInput = {
  viewerUserId?: string | null;
  isPlatformAdmin?: boolean;
  /** Owner preview — show signed-in public card, not self full detail. */
  previewAsPublic?: boolean;
};

export type PublicMemberProfileResult = {
  data: PublicMemberProfileData;
  viewerAccess: ProfileViewerAccessDTO;
};

export async function buildPublicMemberProfile(
  userId: string,
  input: PublicMemberProfileBuildInput = {}
): Promise<PublicMemberProfileResult | null> {
  const user = await findAuthUserById(userId);
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
    countParticipantIntentsByUser(userId),
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
  const profileComplete = isSignupProfileComplete(user.profile);
  const hostTiers = resolveHostTiersFromTenants(linkedTenants, profileComplete);
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

  const showTrustedFields = viewerAccess.exposure === 'full';
  const earnedBadges = badges.filter((b) => b.earned);

  const data: Extract<PublicMemberProfileData, { visibilityState: 'full' }> = {
    visibilityState: 'full',
    id: user._id,
    displayName: user.profile?.displayName ?? user.email.split('@')[0],
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: showTrustedFields || profileVisibility === 'public' ? user.profile?.bio ?? null : null,
    city: profileCity ? USER_CITY_LABELS[profileCity as UserCity] : null,
    memberSince: user.createdAt.toISOString(),
    languages: memberDetails.languages,
    isHost,
    profileRoleLabel,
    isGuideStaff,
    hostProfileKind,
    hostProfilePath: businessOperatorTenant ? resolveHostProfilePath(businessOperatorTenant) : null,
    linkedOperatorName: businessOperatorTenant?.name?.trim() ? businessOperatorTenant.name.trim() : null,
    publishingTenantId: publishingTenant?.id ?? null,
    badges: showTrustedFields ? badges : earnedBadges,
    stats: {
      activitiesAttended,
      activitiesHosted,
    },
    yearGoal: showTrustedFields ? yearGoal : null,
    availability,
  };

  return { data, viewerAccess };
}
