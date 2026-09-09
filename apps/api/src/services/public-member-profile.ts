import { ActivityStatus, TenantBusinessMode, TenantType, UserRole } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users.js';
import {
  countPublishedActivitiesHostedByUser,
  countUserCheckedInParticipations,
} from '../lib/activity-engagement-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { listTenantsByOwnerId } from '../lib/tenant-store.js';
import { BADGE_DEFINITIONS, getTierForPoints } from '../lib/rewards-config.js';
import { findUserBadges } from '../lib/reward-ledger-store.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import { isBusinessHostById } from '../lib/user-type.js';
import {
  canViewProfileField,
  PRIVATE_PROFILE_MESSAGE,
  resolveProfileViewerAccess,
} from './profile-viewer-access.js';

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

const parseMemberDetails = (metadata: unknown, profileDateOfBirth: string | null) => {
  if (!metadata || typeof metadata !== 'object') {
    return {
      age: profileDateOfBirth ? computeAgeFromDateOfBirth(profileDateOfBirth) : null,
      languages: null as string | null,
    };
  }
  const meta = metadata as Record<string, unknown>;
  const legacyDateOfBirth = typeof meta.dateOfBirth === 'string' ? meta.dateOfBirth : null;
  const dateOfBirth = profileDateOfBirth ?? legacyDateOfBirth;
  const languages = typeof meta.languages === 'string' && meta.languages.trim() ? meta.languages.trim() : null;
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
      age: number | null;
      languages: string | null;
      isHost: boolean;
      isGuideStaff?: boolean;
      hostProfileKind: 'shop' | 'agency' | 'guide' | null;
      hostProfilePath: string | null;
      trailPointsEligible: boolean;
      points: number;
      membershipTier: {
        key: string;
        name: string;
        minPoints: number;
        emoji: string;
        tagline: string;
        benefits: string[];
      };
      tierBadges: Array<{
        key: string;
        name: string;
        description: string;
        emoji: string;
        earned: boolean;
        earnedAt: string | null;
      }>;
      badges: Array<{
        key: string;
        name: string;
        description: string;
        emoji: string;
        earned: boolean;
        earnedAt: string | null;
      }>;
      stats: {
        tripsAttended: number;
        tripsHosted: number;
      };
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

  const [tripsAttended, tripsHosted, ownedTenants, badges, businessHost, hostApplication] = await Promise.all([
    countUserCheckedInParticipations(userId),
    countPublishedActivitiesHostedByUser(userId),
    listTenantsByOwnerId(userId),
    findUserBadges(userId),
    isBusinessHostById(userId),
    findLatestHostApplicationByApplicant(userId),
  ]);

  const earnedBadgeKeys = new Set(badges.map((b) => b.badgeKey));
  const points = businessHost ? 0 : (user.profile?.rewardPoints ?? 0);
  const tier = getTierForPoints(points);

  const mapBadge = (def: (typeof BADGE_DEFINITIONS)[number]) => {
    const earned = earnedBadgeKeys.has(def.key);
    const earnedAt = badges.find((b) => b.badgeKey === def.key)?.earnedAt?.toISOString() ?? null;
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
      earned,
      earnedAt,
    };
  };

  const tierBadges = BADGE_DEFINITIONS.filter((b) => b.kind === 'tier').map(mapBadge);
  const achievementBadges = BADGE_DEFINITIONS.filter((b) => b.kind === 'achievement').map(mapBadge);

  const primaryTenant = ownedTenants[0] ?? null;
  const hostProfileKind = resolveHostProfileKind(primaryTenant);
  const isHost = user.role !== UserRole.PARTICIPANT || ownedTenants.length > 0 || tripsHosted > 0;
  const isGuideStaff = user.role === UserRole.TENANT_GUIDE;

  const memberDetails = parseMemberDetails(hostApplication?.metadata, user.profile?.dateOfBirth ?? null);
  const showBio = canViewProfileField(visibility, access, 'bio');
  const showAge = canViewProfileField(visibility, access, 'age');
  const showLanguages = canViewProfileField(visibility, access, 'languages');

  return {
    visibilityState: 'full',
    id: user._id,
    displayName: user.profile?.displayName ?? user.email.split('@')[0],
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: showBio ? user.profile?.bio ?? null : null,
    age: showAge ? memberDetails.age : null,
    languages: showLanguages ? memberDetails.languages : null,
    isHost,
    isGuideStaff,
    hostProfileKind,
    hostProfilePath: primaryTenant ? `/operator/${primaryTenant.slug}` : null,
    trailPointsEligible: !businessHost,
    points,
    membershipTier: {
      key: tier.key,
      name: tier.name,
      minPoints: tier.minPoints,
      emoji: tier.emoji,
      tagline: tier.tagline,
      benefits: tier.benefits,
    },
    tierBadges,
    badges: achievementBadges,
    stats: {
      tripsAttended,
      tripsHosted,
    },
  };
}
