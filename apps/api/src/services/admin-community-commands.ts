import type {
  AdminCommunityListItemDTO,
  CommunityDiscoverVisibility,
  CommunityJoinPolicy,
  CommunityMembershipStatus,
  GeoRef,
} from '@uaetrail/shared-types';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { promotePendingCommunityMember } from '../lib/community-group-members-store.js';
import {
  findCommunityById,
  incrementCommunityMemberCount,
  insertCommunityGroup,
  updateCommunityGroupStatus,
  type CommunityGroupStatus,
} from '../lib/community-groups-store.js';
import { loadAdminCommunityDetail } from './admin-community-read.js';
import { notifyUserAdminAction } from './admin-notifications.js';

export type AdminCreateCommunityInput = {
  name: string;
  slug: string;
  summary?: string | null;
  bannerUrl?: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  adminUserId: string;
  status?: CommunityGroupStatus;
};

export const createAdminDiscoverableCommunity = async (
  input: AdminCreateCommunityInput
): Promise<AdminCommunityListItemDTO> => {
  const host = await findAuthUserById(input.adminUserId);
  if (!host) {
    throw new ApiError(400, 'community_admin_not_found', 'Community host user not found.');
  }

  let row;
  try {
    row = await insertCommunityGroup({
      name: input.name,
      slug: input.slug.trim().toLowerCase(),
      summary: input.summary ?? null,
      bannerUrl: input.bannerUrl ?? null,
      visibility: input.visibility,
      joinPolicy: input.joinPolicy,
      geoRef: input.geoRef,
      adminUserId: input.adminUserId,
      status: input.status,
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      throw new ApiError(409, 'community_slug_taken', 'Community slug is already in use.');
    }
    throw error;
  }

  const detail = await loadAdminCommunityDetail(row.id);
  return detail.community;
};

export const setAdminCommunityStatus = async (input: {
  actorId: string;
  communityId: string;
  status: CommunityGroupStatus;
  comment?: string;
}): Promise<AdminCommunityListItemDTO> => {
  const before = await loadAdminCommunityDetail(input.communityId);
  const updated = await updateCommunityGroupStatus(input.communityId, input.status);
  if (!updated) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }

  await createAuditLog({
    actorId: input.actorId,
    action: `community.${input.status === 'active' ? 'activate' : 'suspend'}`,
    entityType: 'community',
    entityId: input.communityId,
    metadata: input.comment ? { comment: input.comment } : undefined,
  });

  const contactId = before.host?.id ?? before.community.adminUserId;
  if (contactId) {
    await notifyUserAdminAction({
      userId: contactId,
      title: input.status === 'active' ? 'Community reactivated' : 'Community suspended',
      body:
        input.status === 'active'
          ? `Your community "${before.community.name}" is active again on UAE Trail.`
          : input.comment
            ? `Your community "${before.community.name}" has been suspended. Reason: ${input.comment}`
            : `Your community "${before.community.name}" has been suspended by an administrator.`,
      meta: { communityId: input.communityId, slug: before.community.slug },
    });
  }

  const detail = await loadAdminCommunityDetail(input.communityId);
  return detail.community;
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