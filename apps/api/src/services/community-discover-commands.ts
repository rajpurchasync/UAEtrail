import type { CommunityViewerMembershipDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findCommunityMembership, insertCommunityMember } from '../lib/community-group-members-store.js';
import {
  findPublicCommunityById,
  incrementCommunityMemberCount,
} from '../lib/community-groups-store.js';

export const joinDiscoverableCommunity = async (
  userId: string,
  communityId: string
): Promise<CommunityViewerMembershipDTO> => {
  const community = await findPublicCommunityById(communityId);
  if (!community) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  if (community.joinPolicy === 'invite') {
    throw new ApiError(400, 'community_join_invite_only', 'This community is invite-only.');
  }
  const existing = await findCommunityMembership(communityId, userId);
  if (existing) {
    return { status: existing.status };
  }

  const joinStatus = community.joinPolicy === 'request' ? 'pending' : 'member';
  const row = await insertCommunityMember({
    communityId,
    userId,
    status: joinStatus,
  });
  if (joinStatus === 'member') {
    await incrementCommunityMemberCount(communityId, 1);
  }
  return { status: row.status };
};