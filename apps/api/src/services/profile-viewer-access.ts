import { ACTIVE_JOIN_REQUEST_STATUSES } from '../domain/active-join-request-statuses.js';
import { MembershipRole } from '../domain/enums.js';
import {
  countPublishedActivitiesHostedByUser,
  countPublishedActivitiesHostedByUserIds,
  hasParticipantToHostLink,
  hasSharedActivityParticipation,
  hostHasActiveJoinRequestFromUser,
} from '../lib/activity-engagement-store.js';
import { normalizeProfileVisibility, type ProfileVisibility } from '../lib/media-access.js';
import { areAcceptedFriends } from '../lib/friend-store.js';
import { getOrSetRequestScoped } from '../lib/request-scope-cache.js';
import { usersShareActiveGroup } from '../lib/social-groups-store.js';

export type ProfileViewerAccessLevel =
  | 'self'
  | 'public'
  | 'group_member'
  | 'accepted_friend'
  | 'activity_participant'
  | 'host_of_activity'
  | 'platform_admin'
  | 'denied';

export type ProfileViewerAccessResult = {
  level: ProfileViewerAccessLevel;
  /** Viewer may see full profile fields and private media. */
  canViewFullProfile: boolean;
  /** Shared friends/family social group. */
  sharesGroup: boolean;
  /** Accepted co-participants on the same published activity. */
  sharesAcceptedActivity: boolean;
};

const HOST_MEMBERSHIP_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
  MembershipRole.TENANT_GUIDE,
];

export const PRIVATE_PROFILE_MESSAGE = 'User has set their account private';

export const GUEST_MEMBER_PROFILE_MESSAGE =
  'Sign in to view member profiles on UAE Trail.';

/** Host may view a private profile when reviewing requests or managing their activity roster. */
export const viewerIsHostOfTargetOnActivity = async (
  hostUserId: string,
  targetUserId: string
): Promise<boolean> => {
  const [fromJoinRequest, fromParticipantLink] = await Promise.all([
    hostHasActiveJoinRequestFromUser(hostUserId, targetUserId, {
      hostMembershipRoles: HOST_MEMBERSHIP_ROLES,
      activeStatuses: ACTIVE_JOIN_REQUEST_STATUSES,
    }),
    hasParticipantToHostLink({
      hostUserId,
      participantUserId: targetUserId,
      hostMembershipRoles: HOST_MEMBERSHIP_ROLES,
    }),
  ]);
  return fromJoinRequest || fromParticipantLink;
};

/**
 * Hide from map member discovery when private and not hosting any published activity.
 * Hosts still appear on their activity cards via the activity item itself.
 */
export const shouldHideFromMapMemberDiscovery = async (
  userId: string,
  profileVisibility: unknown
): Promise<boolean> => {
  if (normalizeProfileVisibility(profileVisibility) !== 'private') return false;
  const hostedCount = await countPublishedActivitiesHostedByUser(userId);
  return hostedCount === 0;
};

/** Batch map discovery hide for legacy demand pins — one host-count aggregation. */
export const batchShouldHideFromMapMemberDiscovery = async (
  userIds: string[],
  usersById: Map<string, { profile?: { profileVisibility?: unknown } } | undefined>
): Promise<Map<string, boolean>> => {
  const hideByUserId = new Map<string, boolean>();
  const privateUserIds: string[] = [];

  for (const userId of userIds) {
    const visibility = usersById.get(userId)?.profile?.profileVisibility;
    if (normalizeProfileVisibility(visibility) === 'private') {
      privateUserIds.push(userId);
    } else {
      hideByUserId.set(userId, false);
    }
  }

  if (privateUserIds.length === 0) return hideByUserId;

  const hostedCounts = await countPublishedActivitiesHostedByUserIds(privateUserIds);
  for (const userId of privateUserIds) {
    hideByUserId.set(userId, (hostedCounts.get(userId) ?? 0) === 0);
  }

  return hideByUserId;
};

const resolveProfileViewerAccessCore = async (input: {
  viewerUserId: string | null;
  targetUserId: string;
  targetVisibility: unknown;
  isPlatformAdmin?: boolean;
}): Promise<ProfileViewerAccessResult> => {
  const visibility = normalizeProfileVisibility(input.targetVisibility);
  const viewerUserId = input.viewerUserId;
  const targetUserId = input.targetUserId;

  if (input.isPlatformAdmin) {
    return {
      level: 'platform_admin',
      canViewFullProfile: true,
      sharesGroup: true,
      sharesAcceptedActivity: true,
    };
  }

  if (viewerUserId && viewerUserId === targetUserId) {
    return {
      level: 'self',
      canViewFullProfile: true,
      sharesGroup: true,
      sharesAcceptedActivity: true,
    };
  }

  const [sharesGroup, sharesBuddy, hostOfActivity, sharesAcceptedActivity] = await Promise.all([
    viewerUserId ? usersShareActiveGroup(viewerUserId, targetUserId) : Promise.resolve(false),
    viewerUserId ? areAcceptedFriends(viewerUserId, targetUserId) : Promise.resolve(false),
    viewerUserId
      ? viewerIsHostOfTargetOnActivity(viewerUserId, targetUserId)
      : Promise.resolve(false),
    viewerUserId
      ? hasSharedActivityParticipation(viewerUserId, targetUserId)
      : Promise.resolve(false),
  ]);

  if (hostOfActivity) {
    return {
      level: 'host_of_activity',
      canViewFullProfile: true,
      sharesGroup,
      sharesAcceptedActivity,
    };
  }

  if (!viewerUserId) {
    return {
      level: 'denied',
      canViewFullProfile: false,
      sharesGroup,
      sharesAcceptedActivity,
    };
  }

  if (visibility === 'public') {
    return {
      level: 'public',
      canViewFullProfile: false,
      sharesGroup,
      sharesAcceptedActivity,
    };
  }

  if (sharesGroup) {
    return {
      level: 'group_member',
      canViewFullProfile: true,
      sharesGroup: true,
      sharesAcceptedActivity,
    };
  }

  if (sharesBuddy) {
    return {
      level: 'accepted_friend',
      canViewFullProfile: true,
      sharesGroup,
      sharesAcceptedActivity,
    };
  }

  if (sharesAcceptedActivity) {
    return {
      level: 'activity_participant',
      canViewFullProfile: true,
      sharesGroup,
      sharesAcceptedActivity: true,
    };
  }

  if (visibility === 'group_members') {
    return {
      level: 'denied',
      canViewFullProfile: false,
      sharesGroup,
      sharesAcceptedActivity,
    };
  }

  return {
    level: 'denied',
    canViewFullProfile: false,
    sharesGroup,
    sharesAcceptedActivity,
  };
};

/** Viewer-aware authorization for member profiles and private media. */
export const resolveProfileViewerAccess = async (input: {
  viewerUserId: string | null;
  targetUserId: string;
  targetVisibility: unknown;
  isPlatformAdmin?: boolean;
}): Promise<ProfileViewerAccessResult> => {
  const visibility = normalizeProfileVisibility(input.targetVisibility);
  const viewerKey = input.viewerUserId ?? 'guest';
  const cacheKey = `profileViewerAccess:${viewerKey}:${input.targetUserId}:${visibility}:${
    input.isPlatformAdmin ? 'admin' : 'member'
  }`;
  return getOrSetRequestScoped(cacheKey, () => resolveProfileViewerAccessCore(input));
};

export const canViewProfileField = (
  visibility: ProfileVisibility,
  access: ProfileViewerAccessResult,
  field: 'bio' | 'age' | 'city' | 'languages' | 'identity'
): boolean => {
  if (field === 'identity') {
    return visibility !== 'private' || access.canViewFullProfile;
  }
  if (visibility === 'public') return true;
  return access.canViewFullProfile;
};
