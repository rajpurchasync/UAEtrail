import type { CommunityViewerMembershipDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import {
  findPendingCommunityInviteForUser,
  markCommunityInviteAccepted,
} from '../lib/community-group-invites-store.js';
import { findCommunityMembership, insertCommunityMember } from '../lib/community-group-members-store.js';
import {
  findPublicCommunityById,
  incrementCommunityMemberCount,
} from '../lib/community-groups-store.js';
import {
  notifyCommunityHostJoinRequest,
  notifyCommunityHostNewMember,
} from './community-host-notifications.js';
import { listCommunityAdministratorUserIds } from './community-host-access.js';

export const joinDiscoverableCommunity = async (
  userId: string,
  communityId: string,
  email: string
): Promise<CommunityViewerMembershipDTO> => {
  const community = await findPublicCommunityById(communityId);
  if (!community) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const existing = await findCommunityMembership(communityId, userId);
  if (existing) {
    return { status: existing.status };
  }

  if (community.joinPolicy === 'invite') {
    const invite = await findPendingCommunityInviteForUser({
      communityId,
      userId,
      email,
    });
    if (!invite) {
      throw new ApiError(403, 'community_join_invite_required', 'You need an invite to join this community.');
    }
    const row = await insertCommunityMember({
      communityId,
      userId,
      status: 'member',
    });
    await markCommunityInviteAccepted(invite.id);
    await incrementCommunityMemberCount(communityId, 1);
    return { status: row.status };
  }

  const joinStatus = community.joinPolicy === 'request' ? 'pending' : 'member';
  const row = await insertCommunityMember({
    communityId,
    userId,
    status: joinStatus,
  });
  if (joinStatus === 'member') {
    await incrementCommunityMemberCount(communityId, 1);
    const hostUserIds = (await listCommunityAdministratorUserIds(communityId)).filter((id) => id !== userId);
    await Promise.all(
      hostUserIds.map((hostUserId) =>
        notifyCommunityHostNewMember({
          hostUserId,
          communityId: community.id,
          communityName: community.name,
          slug: community.slug,
          memberUserId: userId,
        })
      )
    );
  } else if (joinStatus === 'pending') {
    const hostUserIds = await listCommunityAdministratorUserIds(communityId);
    await Promise.all(
      hostUserIds.map((hostUserId) =>
        notifyCommunityHostJoinRequest({
          hostUserId,
          communityId: community.id,
          communityName: community.name,
          slug: community.slug,
          applicantUserId: userId,
        })
      )
    );
  }
  return { status: row.status };
};