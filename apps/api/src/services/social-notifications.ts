import { NotificationType } from '../domain/enums.js';
import { findGroupById, listGroupMembersDetailed } from '../lib/social-groups-store.js';
import { messagesGroupPath } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyGroupInvite = async (input: {
  invitedUserId: string;
  groupId: string;
  inviteToken: string;
  invitedByUserId: string;
}): Promise<void> => {
  const group = await findGroupById(input.groupId);

  const groupName = group?.name ?? 'a group';
  const inviterName = await resolveNotificationActorDisplayName(
    input.invitedByUserId,
    input.invitedUserId
  );

  scheduleNotification({
    userId: input.invitedUserId,
    title: 'Group invite',
    body: `${inviterName} invited you to join ${groupName}.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'group_invite',
      inviteToken: input.inviteToken,
      groupId: input.groupId,
      groupName,
      actorUserId: input.invitedByUserId,
      path: `/groups?invite=${encodeURIComponent(input.inviteToken)}`,
    },
  }, 'social_notification');
};

export const notifyMemberFollowed = async (input: {
  followerUserId: string;
  followingUserId: string;
}): Promise<void> => {
  const followerName = await resolveNotificationActorDisplayName(
    input.followerUserId,
    input.followingUserId
  );

  scheduleNotification({
    userId: input.followingUserId,
    title: 'New follower',
    body: `${followerName} started following you — they'll get notified when you host an outing.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'connection_member_followed',
      actorUserId: input.followerUserId,
      followerUserId: input.followerUserId,
      path: `/member/${input.followerUserId}`,
    },
  }, 'social_notification');
};

export const notifyGroupWallPost = async (input: {
  groupId: string;
  messageId: string;
  authorUserId: string;
  body: string;
}): Promise<void> => {
  const [group, members] = await Promise.all([
    findGroupById(input.groupId),
    listGroupMembersDetailed(input.groupId),
  ]);

  const groupName = group?.name ?? 'your group';
  const preview = input.body.trim().slice(0, 100);
  const recipientIds = members
    .map((member) => member.userId)
    .filter((userId): userId is string => Boolean(userId) && userId !== input.authorUserId);

  if (recipientIds.length === 0) return;

  await Promise.all(
    recipientIds.map(async (userId) => {
      const authorName = await resolveNotificationActorDisplayName(input.authorUserId, userId);
      scheduleNotification({
        userId,
        title: `New message in ${groupName}`,
        body: `${authorName}: ${preview}`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'group_message',
          groupId: input.groupId,
          groupName,
          messageId: input.messageId,
          actorUserId: input.authorUserId,
          path: messagesGroupPath(input.groupId),
        },
      }, 'social_notification');
    })
  );
};
