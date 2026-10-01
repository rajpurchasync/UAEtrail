import { z } from 'zod';
import { NotificationType } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { env } from '../../config/env.js';
import { findAuthUserByEmail, findAuthUserById } from '../../lib/auth-users.js';
import { findActivityDocInMongo } from '../../lib/entity-sync.js';
import { createNotificationRecord } from '../../lib/notifications-store.js';
import { isActivityGroupChatOpen } from '../../services/activity-group-chat.js';
import { notifyGroupInvite, notifyGroupWallPost } from '../../services/social-notifications.js';
import { publishGroupWallStreamToMembers } from '../../services/group-wall-stream.js';
import { canMemberPostToGroupWall } from '../../lib/group-wall-policy.js';
import { acceptGroupInviteByToken, createGroupInvite, createGroupWallMessage, createKidGroupMember, createSocialGroup, deleteSocialGroup, findGroupById, findGroupMemberById, getGroupMembership, listGroupInvites, listGroupMembersDetailed, listGroupsForUserWithChatPreview, listGroupWallMessages, markGroupWallRead, presentGroupWallMessage, removeGroupMembership, setGroupMembershipActiveState, toggleGroupWallReaction, updateGroupMemberRole, updateGroupWallPostPolicy } from '../../lib/social-groups-store.js';
import { acceptInviteSchema, createGroupSchema, createKidSchema, createWallPostSchema, groupIdParamSchema, groupInviteSchema, groupMembershipIdParamSchema, groupMembershipPatchSchema, groupSettingsPatchSchema, groupWallListQuerySchema, groupWallMessageIdParamSchema, groupWallReactionSchema } from './schemas.js';
import type { Router } from 'express';

export const registerGroupRoutes = (router: Router): void => {
router.get('/me/groups', async (req, res, next) => {
  try {
    const groups = await listGroupsForUserWithChatPreview(req.auth!.userId);
    res.json({
      data: groups.map((group) => ({
        ...group,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        chatPreview: group.chatPreview,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/groups', validate({ body: createGroupSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createGroupSchema>;
    const group = await createSocialGroup({
      creatorUserId: req.auth!.userId,
      type: body.type,
      name: body.name,
      slogan: body.slogan,
      bannerUrl: body.bannerUrl,
      photoUrl: body.photoUrl
    });
    res.status(201).json({ data: group });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/groups/:groupId', validate({ params: groupIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const group = await findGroupById(groupId);
    if (!group) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }
    if (group.adminUserId !== req.auth!.userId) {
      throw new ApiError(403, 'forbidden', 'Only the group creator can delete this group.');
    }
    if (group.type === 'activity') {
      throw new ApiError(400, 'activity_group_locked', 'Activity chats are managed with their activity.');
    }

    await deleteSocialGroup(groupId);
    res.json({ message: 'Group permanently deleted.', data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/me/groups/:groupId',
  validate({ params: groupIdParamSchema, body: groupSettingsPatchSchema }),
  async (req, res, next) => {
    try {
      const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
      const body = req.body as z.infer<typeof groupSettingsPatchSchema>;
      const membership = await getGroupMembership(groupId, req.auth!.userId);
      if (!membership || membership.role !== 'admin') {
        throw new ApiError(403, 'forbidden', 'Only group admins can update chat settings.');
      }

      const group = await findGroupById(groupId);
      if (!group) {
        throw new ApiError(404, 'group_not_found', 'Group not found.');
      }

      const updated = await updateGroupWallPostPolicy(groupId, body.wallPostPolicy);
      if (!updated) {
        throw new ApiError(404, 'group_not_found', 'Group not found.');
      }

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me/groups/:groupId', validate({ params: groupIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }

    const group = await findGroupById(groupId);
    if (!group) {
      throw new ApiError(404, 'group_not_found', 'Group not found.');
    }

    const [members, invites] = await Promise.all([
      listGroupMembersDetailed(groupId),
      membership.role === 'admin' ? listGroupInvites(groupId) : Promise.resolve([])
    ]);

    res.json({
      data: {
        group,
        membership,
        members,
        invites
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/groups/:groupId/invites', validate({ params: groupIdParamSchema, body: groupInviteSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof groupInviteSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can send invites.');
    }

    const group = await findGroupById(groupId);
    if (group?.type === 'activity') {
      throw new ApiError(400, 'activity_group_locked', 'Activity chats add members when requests are approved.');
    }

    const invite = await createGroupInvite({
      groupId,
      invitedByUserId: req.auth!.userId,
      email: body.email,
      role: body.role
    });

    const invitedUser = await findAuthUserByEmail(body.email.trim().toLowerCase());
    if (invitedUser) {
      void notifyGroupInvite({
        invitedUserId: invitedUser._id,
        groupId,
        inviteToken: invite.token,
        invitedByUserId: req.auth!.userId
      });
    }

    const inviteLink = `${env.APP_BASE_URL}/signup?groupInvite=${encodeURIComponent(invite.token)}`;

    res.status(201).json({ data: invite, inviteLink });
  } catch (error) {
    next(error);
  }
});

router.post('/me/group-invites/accept', validate({ body: acceptInviteSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof acceptInviteSchema>;
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    let accepted;
    try {
      accepted = await acceptGroupInviteByToken({
        token: body.token,
        userId: user._id,
        email: user.email
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
      await createNotificationRecord({
        userId: group.adminUserId,
        title: 'Invite accepted',
        body: `${user.profile.displayName ?? user.email} joined ${group.name}.`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'group_invite_accepted',
          groupId: accepted.groupId,
          path: '/groups'
        }
      }).catch(() => undefined);
    }

    res.json({ message: 'Invite accepted.', data: accepted });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/groups/:groupId/members/:membershipId', validate({ params: groupMembershipIdParamSchema, body: groupMembershipPatchSchema }), async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
    const body = req.body as z.infer<typeof groupMembershipPatchSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
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
          ownerUserId: req.auth!.userId
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update member role.';
        if (message.includes('group owner')) {
          throw new ApiError(403, 'forbidden', message);
        }
        throw new ApiError(400, 'invalid_role_change', message);
      }
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/groups/:groupId/members/:membershipId', validate({ params: groupMembershipIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params as z.infer<typeof groupMembershipIdParamSchema>;
    const actorMembership = await getGroupMembership(groupId, req.auth!.userId);
    if (!actorMembership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }

    const target = await findGroupMemberById(groupId, membershipId);
    if (!target) {
      throw new ApiError(404, 'member_not_found', 'Group member not found.');
    }

    const isSelfLeave =
      actorMembership.id === membershipId && target.userId === req.auth!.userId;

    if (isSelfLeave) {
      const group = await findGroupById(groupId);
      if (group?.adminUserId === req.auth!.userId) {
        throw new ApiError(
          403,
          'group_owner_cannot_leave',
          'Group owners must delete the group or transfer ownership before leaving.'
        );
      }
      const result = await removeGroupMembership(membershipId);
      res.json({ data: result });
      return;
    }

    if (actorMembership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can remove other members.');
    }

    const result = await removeGroupMembership(membershipId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/me/groups/:groupId/kids', validate({ params: groupIdParamSchema, body: createKidSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof createKidSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership || membership.role !== 'admin') {
      throw new ApiError(403, 'forbidden', 'Only group admins can add kids.');
    }

    const kid = await createKidGroupMember({
      groupId,
      createdByUserId: req.auth!.userId,
      displayName: body.displayName,
      role: body.role
    });

    res.status(201).json({ data: kid });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/me/groups/:groupId/wall',
  validate({ params: groupIdParamSchema, query: groupWallListQuerySchema }),
  async (req, res, next) => {
    try {
      const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
      const query = req.query as z.infer<typeof groupWallListQuerySchema>;
      const membership = await getGroupMembership(groupId, req.auth!.userId);
      if (!membership) {
        throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
      }
      const { messages, hasMoreOlder } = await listGroupWallMessages(groupId, {
        limit: query.limit ?? 120,
        viewerUserId: req.auth!.userId,
        since: query.since ? new Date(query.since) : undefined,
        before: query.before ? new Date(query.before) : undefined,
        beforeMessageId: query.beforeMessageId,
      });
      res.json({ data: messages, meta: { hasMoreOlder } });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/me/groups/:groupId/wall/read', validate({ params: groupIdParamSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
    if (!membership) {
      throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
    }
    await markGroupWallRead(groupId, req.auth!.userId);
    res.json({ data: { read: true } });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/me/groups/:groupId/wall/:messageId/reactions',
  validate({ params: groupWallMessageIdParamSchema, body: groupWallReactionSchema }),
  async (req, res, next) => {
    try {
      const { groupId, messageId } = req.params as z.infer<typeof groupWallMessageIdParamSchema>;
      const body = req.body as z.infer<typeof groupWallReactionSchema>;
      const membership = await getGroupMembership(groupId, req.auth!.userId);
      if (!membership) {
        throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
      }

      try {
        const result = await toggleGroupWallReaction({
          groupId,
          messageId,
          userId: req.auth!.userId,
          kind: body.kind
        });
        res.json({ data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update reaction.';
        throw new ApiError(404, 'message_not_found', message);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post('/me/groups/:groupId/wall', validate({ params: groupIdParamSchema, body: createWallPostSchema }), async (req, res, next) => {
  try {
    const { groupId } = req.params as z.infer<typeof groupIdParamSchema>;
    const body = req.body as z.infer<typeof createWallPostSchema>;
    const membership = await getGroupMembership(groupId, req.auth!.userId);
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
    if (group.type === 'activity' && group.activityId) {
      const eventDoc = await findActivityDocInMongo(group.activityId);
      if (eventDoc && !isActivityGroupChatOpen(eventDoc.startAt)) {
        throw new ApiError(403, 'activity_chat_closed', 'Activity chat closed one week after the activity.');
      }
    }

    let message;
    try {
      message = await createGroupWallMessage({
        groupId,
        authorUserId: req.auth!.userId,
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
      authorUserId: req.auth!.userId,
      body: message.body
    });

    const data = await presentGroupWallMessage(groupId, message, req.auth!.userId);
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
      req.auth!.userId
    );
    res.status(201).json({ data: { ...data, createdAt } });
  } catch (error) {
    next(error);
  }
});
};
