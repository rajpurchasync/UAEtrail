import type { ActivityDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { listPublishedUpcomingActivitiesByMember } from '../lib/activities-store.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { buildActivityDto } from '../lib/mappers.js';
import { recordMemberProfileView } from '../lib/member-profile-views-store.js';
import { assertAndRecordMemberDiscoveryProfileOpen } from './member-discovery-quota.js';
import { resolveMemberStatus } from './member-status.js';
import { buildPublicMemberProfile } from './public-member-profile.js';
import { resolveProfileViewerAccess } from './profile-viewer-access.js';

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

export const loadPublicMemberProfilePage = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  fromDiscover: boolean;
}) => {
  const profile = await buildPublicMemberProfile(input.userId, {
    viewerUserId: input.viewerUserId,
    isPlatformAdmin: input.isPlatformAdmin,
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

  return { data: profile.data, viewerAccess: profile.viewerAccess };
};

export const listPublicMemberUpcomingActivities = async (input: {
  userId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
  limit: number;
}): Promise<ActivityDTO[]> => {
  const profile = await buildPublicMemberProfile(input.userId, {
    viewerUserId: input.viewerUserId,
    isPlatformAdmin: input.isPlatformAdmin,
  });
  if (!profile) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (profile.viewerAccess.exposure !== 'full') {
    return [];
  }

  const events = await listPublishedUpcomingActivitiesByMember(input.userId, input.limit);
  return events.map((event) => buildActivityDto(event));
};
