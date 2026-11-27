import type { z } from 'zod';
import { NotificationType } from '../domain/enums.js';
import { env } from '../config/env.js';
import { ApiError } from '../lib/api-error.js';
import { findAuthUserByEmail, findAuthUserById } from '../lib/auth-users-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { canMemberPostToGroupWall } from '../lib/group-wall-policy.js';
import { messagesGroupPath } from '../lib/member-routes.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import {
  acceptGroupInviteByToken,
  createGroupInvite,
  createGroupWallMessage,
  createKidGroupMember,
  createSocialGroup,
  deleteSocialGroup,
  findGroupById,
  findGroupMemberById,
  getGroupMembership,
  markGroupWallRead,
  presentGroupWallMessage,
  removeGroupMembership,
  setGroupMembershipActiveState,
  toggleGroupWallReaction,
  updateGroupChatSettings,
  updateGroupMemberRole,
  updateKidGroupMember,
} from '../lib/social-groups-store.js';
import {
  normalizeKidProfileInput,
  type CreateKidBodyInput,
  type PatchKidInput,
} from '../domain/family-kid-profile.js';
import type {
  acceptInviteSchema,
  createGroupSchema,
  createWallPostSchema,
  groupInviteSchema,
  groupMembershipPatchSchema,
  groupSettingsPatchSchema,
  groupWallReactionSchema,
} from '../routes/user/schemas.js';
import {
  isOutingCrewMemberGroup,
  memberTeamAllowsKidRoster,
} from '../domain/member-group.js';
import { isActivityGroupChatOpen } from './activity-group-chat.js';
import { publishGroupWallStreamToMembers } from './group-wall-stream.js';
import { notifyGroupInvite, notifyGroupWallPost } from './social-notifications.js';

export const createMySocialGroup = (
  userId: string,
  body: z.infer<typeof createGroupSchema>
) =>
  createSocialGroup({
    creatorUserId: userId,
    teamLabel: body.teamLabel,
    name: body.name,
    slogan: body.slogan,
    bannerUrl: body.bannerUrl,
    photoUrl: body.photoUrl,
  });

export const deleteMySocialGroup = async (groupId: string, userId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }
  if (group.adminUserId !== userId) {
    throw new ApiError(403, 'forbidden', 'Only the group creator can delete this group.');
  }
  if (isOutingCrewMemberGroup(group)) {
    throw new ApiError(400, 'activity_group_locked', 'Activity chats are managed with their activity.');
  }

  await deleteSocialGroup(groupId);
  return { deleted: true };
};

export const updateMyGroupChatSettings = async (
  groupId: string,
  userId: string,
  body: z.infer<typeof groupSettingsPatchSchema>
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'Only group admins can update chat settings.');
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  if (body.photoUrl !== undefined && isOutingCrewMemberGroup(group)) {
    throw new ApiError(
      400,
      'activity_group_locked',
      'Activity group image is synced from the outing cover.'
    );
  }

  const photoUrl =
    body.photoUrl === undefined
      ? undefined
      : body.photoUrl === '' || body.photoUrl === null
        ? null
        : body.photoUrl;

  const updated = await updateGroupChatSettings(groupId, {
    wallPostPolicy: body.wallPostPolicy,
    photoUrl,
    name: body.name?.trim(),
  });
  if (!updated) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  return updated;
};

export const inviteToMyGroup = async (
  groupId: string,
  userId: string,
  body: z.infer<typeof groupInviteSchema>
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'Only group admins can send invites.');
  }

  const group = await findGroupById(groupId);
  if (group && isOutingCrewMemberGroup(group)) {
    throw new ApiError(400, 'activity_group_locked', 'Activity chats add members when requests are approved.');
  }

  const invite = await createGroupInvite({
    groupId,
    invitedByUserId: userId,
    email: body.email,
    role: body.role,
  });

  const invitedUser = await findAuthUserByEmail(body.email.trim().toLowerCase());
  if (invitedUser) {
    void notifyGroupInvite({
      invitedUserId: invitedUser._id,
      groupId,
      inviteToken: invite.token,
      invitedByUserId: userId,
    });
  }

  const inviteLink = `${env.APP_BASE_URL}/signup?groupInvite=${encodeURIComponent(invite.token)}`;
  return { invite, inviteLink };
};

export const acceptMyGroupInvite = async (userId: string, body: z.infer<typeof acceptInviteSchema>) => {
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  let accepted;
  try {
    accepted = await acceptGroupInviteByToken({
      token: body.token,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    throw new ApiError(400, 'invite_email_mismatch', error instanceof Error ? error.message : 'Invalid invite.');
  }

  if (!accepted) {
    throw new ApiError(404, 'invite_not_found', 'Invite not found.');
  }
  if (accepted.status !== 'accepted') {
    throw new ApiError(400, 'invite_not_active', 'Invite is no longer active.');
  }

  const group = await findGroupById(accepted.groupId);
  if (group) {
    scheduleSideEffect(
      createNotificationRecord({
        userId: group.adminUserId,
        title: 'Invite accepted',
        body: `${user.profile.displayName ?? user.email} joined ${group.name}.`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'group_invite_accepted',
          groupId: accepted.groupId,
          actorUserId: user._id,
          path: messagesGroupPath(accepted.groupId),
        },
      }),
      'group.invite_accepted_notification'
    );
  }

  return accepted;
};

export const patchMyGroupMember = async (
  groupId: string,
  membershipId: string,
  userId: string,
  body: z.infer<typeof groupMembershipPatchSchema>
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }

  const target = await findGroupMemberById(groupId, membershipId);
  if (!target) {
    throw new ApiError(404, 'member_not_found', 'Group member not found.');
  }

  let updated = target;

  if (body.isActive !== undefined) {
    if (membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can change member access.');
    }
    updated = await setGroupMembershipActiveState(membershipId, body.isActive);
  }

  if (body.role !== undefined) {
    try {
      updated = await updateGroupMemberRole({
        groupId,
        membershipId,
        role: body.role,
        ownerUserId: userId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update member role.';
      if (message.includes('group owner')) {
        throw new ApiError(403, 'forbidden', message);
      }
      throw new ApiError(400, 'invalid_role_change', message);
    }
  }

  return updated;
};

export const removeMyGroupMember = async (groupId: string, membershipId: string, userId: string) => {
  const actorMembership = await getGroupMembership(groupId, userId);
  if (!actorMembership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }

  const target = await findGroupMemberById(groupId, membershipId);
  if (!target) {
    throw new ApiError(404, 'member_not_found', 'Group member not found.');
  }

  const isSelfLeave = actorMembership.id === membershipId && target.userId === userId;

  if (isSelfLeave) {
    const group = await findGroupById(groupId);
    if (group?.adminUserId === userId) {
      throw new ApiError(
        403,
        'group_owner_cannot_leave',
        'Group owners must delete the group or transfer ownership before leaving.'
      );
    }
    return removeGroupMembership(membershipId);
  }

  if (actorMembership.role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'Only group admins can remove other members.');
  }

  const group = await findGroupById(groupId);
  if (group && target.userId && target.userId === group.adminUserId) {
    throw new ApiError(403, 'forbidden', 'The group owner cannot be removed.');
  }

  return removeGroupMembership(membershipId);
};

export const createMyGroupKidMember = async (
  groupId: string,
  userId: string,
  body: CreateKidBodyInput
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'Only group admins can add kids.');
  }
  const group = await findGroupById(groupId);
  if (!group || !memberTeamAllowsKidRoster(group)) {
    throw new ApiError(
      400,
      'kids_family_teams_only',
      'Child roster is only available on Family teams.'
    );
  }

  if ('rosterOnly' in body && body.rosterOnly === true) {
    return createKidGroupMember({
      groupId,
      createdByUserId: userId,
      displayName: body.displayName,
      role: body.role,
    });
  }

  const normalized = normalizeKidProfileInput(body);
  return createKidGroupMember({
    groupId,
    createdByUserId: userId,
    displayName: normalized.displayName!,
    dateOfBirth: normalized.dateOfBirth ?? null,
    emergencyContactName: normalized.emergencyContactName ?? null,
    emergencyContactPhone: normalized.emergencyContactPhone ?? null,
    emergencyContactRelation: normalized.emergencyContactRelation ?? null,
    medicalConditions: normalized.medicalConditions ?? null,
    gender: normalized.gender ?? null,
    photoUrl: normalized.photoUrl ?? null,
    role: body.role,
  });
};

export const updateMyGroupKidMember = async (
  groupId: string,
  membershipId: string,
  userId: string,
  body: PatchKidInput
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership || membership.role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'Only group admins can edit kids.');
  }

  const kid = await findGroupMemberById(groupId, membershipId);
  if (!kid || kid.memberType !== 'kid') {
    throw new ApiError(404, 'member_not_found', 'Kid profile not found.');
  }

  const normalized = normalizeKidProfileInput(body);
  return updateKidGroupMember(membershipId, normalized);
};

export const markMyGroupWallRead = async (groupId: string, userId: string) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }
  await markGroupWallRead(groupId, userId);
  return { read: true };
};

export const toggleMyGroupWallReaction = async (
  groupId: string,
  messageId: string,
  userId: string,
  body: z.infer<typeof groupWallReactionSchema>
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }

  try {
    return await toggleGroupWallReaction({
      groupId,
      messageId,
      userId,
      kind: body.kind,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update reaction.';
    throw new ApiError(404, 'message_not_found', message);
  }
};

export const postToMyGroupWall = async (
  groupId: string,
  userId: string,
  body: z.infer<typeof createWallPostSchema>
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }
  if (!canMemberPostToGroupWall(group, membership)) {
    throw new ApiError(403, 'wall_post_forbidden', 'Only admins can post in this group chat.');
  }
  if (isOutingCrewMemberGroup(group) && group.activityId) {
    const eventDoc = await findActivityDocInMongo(group.activityId);
    if (eventDoc && !isActivityGroupChatOpen(eventDoc.startAt)) {
      throw new ApiError(403, 'activity_chat_closed', 'Activity chat closed one week after the activity.');
    }
  }

  let message;
  try {
    message = await createGroupWallMessage({
      groupId,
      authorUserId: userId,
      body: body.body,
      replyToMessageId: body.replyToMessageId,
    });
  } catch (error) {
    const code = error instanceof Error && error.message === 'reply_not_found' ? 'reply_not_found' : null;
    if (code) {
      throw new ApiError(400, code, 'Reply target message was not found in this chat.');
    }
    throw error;
  }

  void notifyGroupWallPost({
    groupId,
    messageId: message.id,
    authorUserId: userId,
    body: message.body,
  });

  const data = await presentGroupWallMessage(groupId, message, userId);
  const createdAt =
    data.createdAt instanceof Date ? data.createdAt.toISOString() : String(data.createdAt);
  void publishGroupWallStreamToMembers(
    {
      groupId,
      message: {
        id: data.id,
        groupId: data.groupId,
        authorUserId: data.authorUserId,
        body: data.body,
        createdAt,
        replyToMessageId: data.replyToMessageId ?? null,
        replyToPreview: data.replyToPreview ?? null,
        author: data.author,
        reactions: data.reactions ?? [],
      },
    },
    userId
  );

  return { ...data, createdAt };
};
