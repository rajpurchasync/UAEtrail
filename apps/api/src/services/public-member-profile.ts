import { TenantBusinessMode, TenantType, UserRole } from '../domain/enums.js';
import { resolveHostTiersFromTenants } from '../domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { resolveOwnedProfileType } from '../lib/tenant-store.js';
import type { MemberProfileRoleLabel } from '@uaetrail/shared-types';
import { findAuthUserById } from '../lib/auth-users.js';
import {
  countPublishedActivitiesHostedByUser,
  countUserCheckedInParticipations,
} from '../lib/activity-engagement-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { listTenantsByOwnerId } from '../lib/tenant-store.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import {
  USER_CITY_LABELS,
  type UserCity,
} from '../domain/user-profile.js';
import {
  canViewProfileField,
  PRIVATE_PROFILE_MESSAGE,
  resolveProfileViewerAccess,
} from './profile-viewer-access.js';
import { getMemberGoalPublicSnapshot } from '../lib/member-goals-store.js';
import { countParticipantIntentsByUser } from '../lib/participant-intents-store.js';
import type { MemberGoalPublicDTO } from '@uaetrail/shared-types';
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
  const legacyDateOfBirth = typeof meta.dateOfBirth === 'string' ? meta.dateOfBirth : null;
  const dateOfBirth = profileDateOfBirth ?? legacyDateOfBirth;
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

export type PublicMemberProfileBuildInput = {
  viewerUserId?: string | null;
  isPlatformAdmin?: boolean;
};

export type PublicMemberProfileResponse =
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
      hostProfilePath: string | null;
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
    };

export async function buildPublicMemberProfile(
  userId: string,
  input: PublicMemberProfileBuildInput = {}
): Promise<PublicMemberProfileResponse | null> {
  const user = await findAuthUserById(userId);
  if (!user) return null;

  const visibility = normalizeProfileVisibility(user.profile?.profileVisibility);
  const access = await resolveProfileViewerAccess({
    viewerUserId: input.viewerUserId ?? null,
    targetUserId: userId,
    targetVisibility: visibility,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  if (visibility === 'private' && !canViewProfileField(visibility, access, 'identity')) {
    return {
      visibilityState: 'private',
      id: user._id,
      message: PRIVATE_PROFILE_MESSAGE,
    };
  }

  const [activitiesAttended, activitiesHosted, demandPosts, ownedTenants, hostApplication, yearGoal, badges] =
    await Promise.all([
    countUserCheckedInParticipations(userId),
    countPublishedActivitiesHostedByUser(userId),
    countParticipantIntentsByUser(userId),
    listTenantsByOwnerId(userId),
    findLatestHostApplicationByApplicant(userId),
    getMemberGoalPublicSnapshot(userId),
    listPublicMemberBadges(userId),
  ]);

  const primaryTenant = ownedTenants[0] ?? null;
  const hostProfileKind = resolveHostProfileKind(primaryTenant);
  const profileComplete = isSignupProfileComplete(user.profile);
  const hostTiers = resolveHostTiersFromTenants(ownedTenants, profileComplete);
  const hasAgencyProfile = ownedTenants.some((t) => resolveOwnedProfileType(t) === 'agency');
  const hasShopProfile = ownedTenants.some((t) => resolveOwnedProfileType(t) === 'shop');
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
  const showBio = canViewProfileField(visibility, access, 'bio');
  const showCity = canViewProfileField(visibility, access, 'city');
  const showLanguages = canViewProfileField(visibility, access, 'languages');
  const profileCity = user.profile?.city ?? null;

  return {
    visibilityState: 'full',
    id: user._id,
    displayName: user.profile?.displayName ?? user.email.split('@')[0],
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: showBio ? user.profile?.bio ?? null : null,
    city: showCity && profileCity ? USER_CITY_LABELS[profileCity as UserCity] : null,
    memberSince: user.createdAt.toISOString(),
    languages: showLanguages ? memberDetails.languages : null,
    isHost,
    profileRoleLabel,
    isGuideStaff,
    hostProfileKind,
    hostProfilePath: primaryTenant ? `/operator/${primaryTenant.slug}` : null,
    badges,
    stats: {
      activitiesAttended,
      activitiesHosted,
    },
    yearGoal,
  };
}
