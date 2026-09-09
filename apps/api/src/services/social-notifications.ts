import { NotificationType } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { findGroupById, listGroupMembersDetailed } from '../lib/social-groups-store.js';
import { dispatchNotification } from './notifications.js';

export const notifyGroupInvite = async (input: {
  invitedUserId: string;
  groupId: string;
  inviteToken: string;
  invitedByUserId: string;
}): Promise<void> => {
  const [group, inviter] = await Promise.all([
    findGroupById(input.groupId),
    findAuthUserById(input.invitedByUserId)
  ]);

  const groupName = group?.name ?? 'a group';
  const inviterName = inviter?.profile.displayName ?? inviter?.email ?? 'Someone';

  await dispatchNotification({
    userId: input.invitedUserId,
    title: 'Group invite',
    body: `${inviterName} invited you to join ${groupName}.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'buddy_request',
      inviteToken: input.inviteToken,
      groupId: input.groupId,
      groupName,
      invitedByUserId: input.invitedByUserId,
      path: `/groups?invite=${encodeURIComponent(input.inviteToken)}`
    }
  }).catch(() => undefined);
};

export const notifyGroupWallPost = async (input: {
  groupId: string;
  messageId: string;
  authorUserId: string;
  body: string;
}): Promise<void> => {
  const [group, author, members] = await Promise.all([
    findGroupById(input.groupId),
    findAuthUserById(input.authorUserId),
    listGroupMembersDetailed(input.groupId)
  ]);

  const groupName = group?.name ?? 'your group';
  const authorName = author?.profile.displayName ?? author?.email ?? 'Someone';
  const preview = input.body.trim().slice(0, 100);
  const recipientIds = members
    .map((member) => member.userId)
    .filter((userId): userId is string => Boolean(userId) && userId !== input.authorUserId);

  if (recipientIds.length === 0) return;

  await Promise.all(
    recipientIds.map((userId) =>
      dispatchNotification({
        userId,
        title: `New message in ${groupName}`,
        body: `${authorName}: ${preview}`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'group_message',
          groupId: input.groupId,
          groupName,
          messageId: input.messageId,
          authorUserId: input.authorUserId,
          path: `/groups?group=${encodeURIComponent(input.groupId)}`
        }
      }).catch(() => undefined)
    )
  );
};
