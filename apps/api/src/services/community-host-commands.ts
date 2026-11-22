import type {
  CommunityDiscoverDetailDTO,
  CommunityGroupStatus,
  CommunityHostManageDTO,
  CommunityHostProfilePatchDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import {
  deleteCommunityGroupAdmin,
  findCommunityGroupAdmin,
  insertCommunityGroupAdmin,
} from '../lib/community-group-admins-store.js';
import { insertCommunityGroupInvite } from '../lib/community-group-invites-store.js';
import {
  deleteCommunityMembership,
  findCommunityMembership,
  promotePendingCommunityMember,
} from '../lib/community-group-members-store.js';
import {
  findCommunityById,
  incrementCommunityMemberCount,
  patchCommunityGroupProfile,
  updateCommunityGroupStatus,
} from '../lib/community-groups-store.js';
import { ActivityStatus } from '../domain/enums.js';
import { findActivityDocInMongo, patchActivityInMongo } from '../lib/entity-sync.js';
import { loadExploreCommunityDiscoverDetail } from './community-discover-read.js';
import { notifyCommunityMemberApproved } from './community-host-notifications.js';
import { assertCommunityAdministrator, resolveCommunityHostAdminRole } from './community-host-access.js';
import { loadCommunityHostManageSurface } from './community-host-read.js';

export const patchCommunityProfileByHost = async (
  userId: string,
  email: string,
  communityId: string,
  patch: CommunityHostProfilePatchDTO
): Promise<CommunityDiscoverDetailDTO> => {
  await assertCommunityAdministrator(communityId, userId);
  const updated = await patchCommunityGroupProfile(communityId, patch);
  if (!updated) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  return loadExploreCommunityDiscoverDetail(updated.slug, { userId, email });
};

export const leaveDiscoverableCommunity = async (
  userId: string,
  email: string,
  communityId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const community = await findCommunityById(communityId);
  if (!community || community.status !== 'active' || community.visibility !== 'public') {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const removed = await deleteCommunityMembership(communityId, userId);
  if (!removed) {
    throw new ApiError(404, 'community_membership_not_found', 'You are not a member of this community.');
  }
  if (removed.status === 'member') {
    await incrementCommunityMemberCount(communityId, -1);
  }
  return loadExploreCommunityDiscoverDetail(community.slug, { userId, email });
};

export const removeCommunityMemberByHost = async (
  hostUserId: string,
  email: string,
  communityId: string,
  memberUserId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);
  if (memberUserId === community.adminUserId) {
    throw new ApiError(400, 'community_cannot_remove_host', 'The community host cannot be removed.');
  }
  const adminRow = await findCommunityGroupAdmin(communityId, memberUserId);
  if (adminRow) {
    throw new ApiError(400, 'community_cannot_remove_admin', 'Remove co-admin rights before removing this member.');
  }
  const removed = await deleteCommunityMembership(communityId, memberUserId);
  if (!removed) {
    throw new ApiError(404, 'community_membership_not_found', 'Member not found in this community.');
  }
  if (removed.status === 'member') {
    await incrementCommunityMemberCount(communityId, -1);
  }
  return loadExploreCommunityDiscoverDetail(community.slug, { userId: hostUserId, email });
};

export const approveCommunityMemberByHost = async (
  hostUserId: string,
  email: string,
  communityId: string,
  memberUserId: string
): Promise<CommunityDiscoverDetailDTO> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);
  const promoted = await promotePendingCommunityMember(communityId, memberUserId);
  if (!promoted) {
    throw new ApiError(404, 'community_pending_member_not_found', 'No pending join request for this member.');
  }
  await incrementCommunityMemberCount(communityId, 1);
  await notifyCommunityMemberApproved({
    memberUserId,
    communityName: community.name,
    slug: community.slug,
    communityId: community.id,
  });
  return loadExploreCommunityDiscoverDetail(community.slug, { userId: hostUserId, email });
};

export const inviteCommunityMemberByHost = async (
  hostUserId: string,
  communityId: string,
  input: { email?: string; userId?: string }
): Promise<void> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);
  if (community.joinPolicy !== 'invite') {
    throw new ApiError(400, 'community_not_invite_only', 'Invites apply to invite-only communities.');
  }

  let email = input.email?.trim().toLowerCase();
  let userId = input.userId ?? null;
  if (userId) {
    const user = await findAuthUserById(userId);
    if (!user) {
      throw new ApiError(400, 'community_invite_user_not_found', 'Invite target user not found.');
    }
    email = user.email.toLowerCase();
    userId = user._id;
  }
  if (!email) {
    throw new ApiError(400, 'community_invite_email_required', 'Provide email or userId for the invite.');
  }

  await insertCommunityGroupInvite({
    communityId,
    email,
    userId,
    invitedByUserId: hostUserId,
  });
};

export const linkPublishedActivityToDiscoverCommunity = async (
  hostUserId: string,
  communityId: string,
  activityId: string
): Promise<{ ok: true; activityId: string; discoverCommunityId: string }> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);
  if (community.status !== 'active') {
    throw new ApiError(400, 'community_not_active', 'Community must be active to link outings.');
  }

  const activity = await findActivityDocInMongo(activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  if (activity.status !== ActivityStatus.PUBLISHED) {
    throw new ApiError(400, 'activity_not_published', 'Only published outings can be linked to a community.');
  }
  const ownsActivity =
    activity.hostId === hostUserId || activity.createdById === hostUserId;
  if (!ownsActivity) {
    throw new ApiError(403, 'activity_host_required', 'You can only link outings you host.');
  }

  await patchActivityInMongo(activityId, { discoverCommunityId: communityId });
  return { ok: true, activityId, discoverCommunityId: communityId };
};

export const addCommunityCoAdminByHost = async (
  ownerUserId: string,
  communityId: string,
  targetUserId: string
): Promise<CommunityHostManageDTO> => {
  const community = await assertCommunityAdministrator(communityId, ownerUserId);
  const role = await resolveCommunityHostAdminRole(community, ownerUserId);
  if (role !== 'owner') {
    throw new ApiError(403, 'community_owner_required', 'Only the community owner can add co-hosts.');
  }
  if (targetUserId === community.adminUserId) {
    throw new ApiError(400, 'community_already_owner', 'That user is already the community owner.');
  }
  const membership = await findCommunityMembership(communityId, targetUserId);
  if (!membership || membership.status !== 'member') {
    throw new ApiError(400, 'community_coadmin_must_be_member', 'Co-hosts must be active members first.');
  }
  const existing = await findCommunityGroupAdmin(communityId, targetUserId);
  if (existing?.role === 'admin') {
    throw new ApiError(409, 'community_coadmin_exists', 'That member is already a co-host.');
  }
  await insertCommunityGroupAdmin({ communityId, userId: targetUserId, role: 'admin' });
  return loadCommunityHostManageSurface(ownerUserId, communityId);
};

export const removeCommunityCoAdminByHost = async (
  ownerUserId: string,
  communityId: string,
  targetUserId: string
): Promise<CommunityHostManageDTO> => {
  const community = await assertCommunityAdministrator(communityId, ownerUserId);
  const role = await resolveCommunityHostAdminRole(community, ownerUserId);
  if (role !== 'owner') {
    throw new ApiError(403, 'community_owner_required', 'Only the community owner can remove co-hosts.');
  }
  const removed = await deleteCommunityGroupAdmin(communityId, targetUserId);
  if (!removed) {
    throw new ApiError(404, 'community_coadmin_not_found', 'Co-host not found.');
  }
  return loadCommunityHostManageSurface(ownerUserId, communityId);
};

export const setCommunityStatusByHost = async (
  hostUserId: string,
  email: string,
  communityId: string,
  status: CommunityGroupStatus
): Promise<CommunityDiscoverDetailDTO> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);
  if (community.status === status) {
    return loadExploreCommunityDiscoverDetail(community.slug, { userId: hostUserId, email });
  }
  const updated = await updateCommunityGroupStatus(communityId, status);
  if (!updated) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  return loadExploreCommunityDiscoverDetail(community.slug, { userId: hostUserId, email });
};