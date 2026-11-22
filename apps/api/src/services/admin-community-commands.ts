import type {
  CommunityDiscoverCardDTO,
  CommunityDiscoverVisibility,
  CommunityJoinPolicy,
  CommunityMembershipStatus,
  GeoRef,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { promotePendingCommunityMember } from '../lib/community-group-members-store.js';
import {
  findCommunityById,
  incrementCommunityMemberCount,
  insertCommunityGroup,
  type CommunityGroupRecord,
  type CommunityGroupStatus,
} from '../lib/community-groups-store.js';

export type AdminCreateCommunityInput = {
  name: string;
  slug: string;
  summary?: string | null;
  bannerUrl?: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  status?: CommunityGroupStatus;
};

const toCard = (row: CommunityGroupRecord): CommunityDiscoverCardDTO => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  summary: row.summary,
  bannerUrl: row.bannerUrl,
  visibility: row.visibility,
  joinPolicy: row.joinPolicy,
  geoRef: row.geoRef,
  memberCount: row.memberCount,
});

export const createAdminDiscoverableCommunity = async (
  input: AdminCreateCommunityInput
): Promise<CommunityDiscoverCardDTO> => {
  try {
    const row = await insertCommunityGroup({
      name: input.name,
      slug: input.slug.trim().toLowerCase(),
      summary: input.summary ?? null,
      bannerUrl: input.bannerUrl ?? null,
      visibility: input.visibility,
      joinPolicy: input.joinPolicy,
      geoRef: input.geoRef,
      status: input.status,
    });
    return toCard(row);
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      throw new ApiError(409, 'community_slug_taken', 'Community slug is already in use.');
    }
    throw error;
  }
};

export const approveAdminCommunityMember = async (
  communityId: string,
  userId: string
): Promise<{ status: CommunityMembershipStatus }> => {
  const community = await findCommunityById(communityId);
  if (!community) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const promoted = await promotePendingCommunityMember(communityId, userId);
  if (!promoted) {
    throw new ApiError(404, 'community_pending_member_not_found', 'No pending join request for this member.');
  }
  await incrementCommunityMemberCount(communityId, 1);
  return { status: promoted.status };
};