import type { ActivityDTO } from '@uaetrail/shared-types';
import { canViewProfileField, mergeProfileFieldPrivacy } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById, type AuthUserRecord } from '../lib/auth-users-store.js';
import {
  listPublishedPastActivitiesByMember,
  listPublishedUpcomingActivitiesByMember,
} from '../lib/activities-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateByIds } from '../lib/activity-private-store.js';
import { stripRideshareVehicleFromActivityDto } from '../lib/rideshare-vehicle-crew.js';
import { recordMemberProfileView } from '../lib/member-profile-views-store.js';
import { assertAndRecordMemberDiscoveryProfileOpen } from './member-discovery-quota.js';
import { resolveMemberStatus } from './member-status.js';
import {
  buildPublicMemberProfile,
  type PublicMemberProfileResult,
} from './public-member-profile.js';
import type { MemberProfilePageIncludes } from './member-profile-includes.js';
import { resolveFindCrewViewerRelation } from '../lib/find-crew-visibility-gate.js';
import { resolveProfileViewerAccess } from './profile-viewer-access.js';
import { loadMemberProfileSocialGraph } from './member-profile-social-graph.js';

export const loadPublicMemberBrief = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
}) => {
  const user = await findAuthUserById(input.userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const visibility = normalizeProfileVisibility(user.profile?.profileVisibility);
  const access = await resolveProfileViewerAccess({
    viewerUserId: input.viewerUserId,
    targetUserId: input.userId,
    targetVisibility: visibility,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  if (visibility === 'private' && !access.canViewFullProfile) {
    return {
      id: user._id,
      displayName: 'Private member',
      avatarUrl: null,
    };
  }

  return {
    id: user._id,
    displayName: user.profile.displayName ?? user.email.split('@')[0],
    avatarUrl: user.profile.avatarUrl ?? null,
  };
};

const needsPreloadedTarget = (includes: MemberProfilePageIncludes): boolean =>
  includes.socialGraph || includes.upcoming || includes.past;

export const loadPublicMemberProfilePage = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  fromDiscover: boolean;
  includes?: MemberProfilePageIncludes;
  upcomingLimit?: number;
  pastLimit?: number;
}) => {
  const includes = input.includes ?? { socialGraph: false, upcoming: false, past: false };
  const preloadedTarget = needsPreloadedTarget(includes) ? await findAuthUserById(input.userId) : null;
  if (needsPreloadedTarget(includes) && !preloadedTarget) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const profile = await buildPublicMemberProfile(input.userId, {
    viewerUserId: input.viewerUserId,
    isPlatformAdmin: input.isPlatformAdmin,
    preloadedUser: preloadedTarget,
  });
  if (!profile) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const mayCountView =
    input.viewerUserId &&
    input.viewerUserId !== input.userId &&
    (profile.viewerAccess.exposure === 'public' || profile.viewerAccess.exposure === 'full');

  if (input.fromDiscover && mayCountView && input.viewerUserId) {
    const hostStatus = await resolveMemberStatus(input.viewerUserId);
    await assertAndRecordMemberDiscoveryProfileOpen({
      viewerUserId: input.viewerUserId,
      profileUserId: input.userId,
      hostStatus,
    });
  } else if (mayCountView && !input.fromDiscover && input.viewerUserId) {
    void recordMemberProfileView({
      profileUserId: input.userId,
      viewerUserId: input.viewerUserId,
    }).catch(() => undefined);
  }

  const upcomingLimit = Math.min(Math.max(input.upcomingLimit ?? 8, 1), 20);
  const pastLimit = Math.min(Math.max(input.pastLimit ?? 8, 1), 20);

  const [socialGraph, upcomingActivities, pastActivities] = await Promise.all([
    includes.socialGraph
      ? loadMemberProfileSocialGraph({
          targetUserId: input.userId,
          viewerUserId: input.viewerUserId,
          isPlatformAdmin: input.isPlatformAdmin,
          preloadedTarget,
        })
      : Promise.resolve(undefined),
    includes.upcoming
      ? listPublicMemberUpcomingActivities({
          userId: input.userId,
          viewerUserId: input.viewerUserId,
          isPlatformAdmin: input.isPlatformAdmin,
          limit: upcomingLimit,
          profileBundle: profile,
          preloadedOwner: preloadedTarget,
        })
      : Promise.resolve(undefined),
    includes.past
      ? listPublicMemberPastActivities({
          userId: input.userId,
          viewerUserId: input.viewerUserId,
          isPlatformAdmin: input.isPlatformAdmin,
          limit: pastLimit,
          profileBundle: profile,
          preloadedOwner: preloadedTarget,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    data: profile.data,
    viewerAccess: profile.viewerAccess,
    socialGraph,
    upcomingActivities,
    pastActivities,
  };
};

export const listPublicMemberUpcomingActivities = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  limit: number;
  profileBundle?: PublicMemberProfileResult | null;
  preloadedOwner?: AuthUserRecord | null;
}): Promise<ActivityDTO[]> => {
  const profile =
    input.profileBundle ??
    (await buildPublicMemberProfile(input.userId, {
      viewerUserId: input.viewerUserId,
      isPlatformAdmin: input.isPlatformAdmin,
      preloadedUser: input.preloadedOwner,
    }));
  if (!profile) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (profile.viewerAccess.exposure === 'none') {
    return [];
  }
  const owner =
    input.preloadedOwner && input.preloadedOwner._id === input.userId
      ? input.preloadedOwner
      : await findAuthUserById(input.userId);
  const fieldPrivacy = mergeProfileFieldPrivacy(owner?.profile?.fieldPrivacy);
  const isSelf = Boolean(input.viewerUserId && input.viewerUserId === input.userId);
  const networkRelation = isSelf
    ? ('self' as const)
    : await resolveFindCrewViewerRelation(input.viewerUserId, input.userId);
  if (
    !canViewProfileField(
      fieldPrivacy.upcomingActivities,
      profile.viewerAccess.exposure,
      isSelf,
      networkRelation
    )
  ) {
    return [];
  }

  const events = await listPublishedUpcomingActivitiesByMember(input.userId, input.limit);
  const privateById = await findActivityPrivateByIds(events.map((e) => e.id));
  return events.map((event) =>
    stripRideshareVehicleFromActivityDto(
      buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null })
    )
  );
};

export const listPublicMemberPastActivities = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  limit: number;
  profileBundle?: PublicMemberProfileResult | null;
  preloadedOwner?: AuthUserRecord | null;
}): Promise<ActivityDTO[]> => {
  const profile =
    input.profileBundle ??
    (await buildPublicMemberProfile(input.userId, {
      viewerUserId: input.viewerUserId,
      isPlatformAdmin: input.isPlatformAdmin,
      preloadedUser: input.preloadedOwner,
    }));
  if (!profile) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (profile.viewerAccess.exposure === 'none') {
    return [];
  }
  const owner =
    input.preloadedOwner && input.preloadedOwner._id === input.userId
      ? input.preloadedOwner
      : await findAuthUserById(input.userId);
  const fieldPrivacy = mergeProfileFieldPrivacy(owner?.profile?.fieldPrivacy);
  const isSelf = Boolean(input.viewerUserId && input.viewerUserId === input.userId);
  const networkRelation = isSelf
    ? ('self' as const)
    : await resolveFindCrewViewerRelation(input.viewerUserId, input.userId);
  if (
    !canViewProfileField(
      fieldPrivacy.tripHistory,
      profile.viewerAccess.exposure,
      isSelf,
      networkRelation
    )
  ) {
    return [];
  }

  const events = await listPublishedPastActivitiesByMember(input.userId, input.limit);
  const privateById = await findActivityPrivateByIds(events.map((e) => e.id));
  return events.map((event) =>
    stripRideshareVehicleFromActivityDto(
      buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null })
    )
  );
};
