import { NotificationType } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { dispatchNotification } from './notifications.js';

export const notifyBuddyRequestReceived = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const sender = await findAuthUserById(input.fromUserId);
  const senderName = sender?.profile?.displayName ?? sender?.email ?? 'Someone';

  await dispatchNotification({
    userId: input.toUserId,
    title: 'Buddy request',
    body: `${senderName} wants to connect with you on UAE Trail.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'connection_buddy_request',
      requestId: input.requestId,
      fromUserId: input.fromUserId,
      path: `/member/${input.fromUserId}`,
    },
  }).catch(() => undefined);
};

export const notifyBuddyRequestAccepted = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const accepter = await findAuthUserById(input.toUserId);
  const accepterName = accepter?.profile?.displayName ?? accepter?.email ?? 'Someone';

  await dispatchNotification({
    userId: input.fromUserId,
    title: 'Buddy request accepted',
    body: `${accepterName} accepted your buddy request.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'connection_buddy_accepted',
      requestId: input.requestId,
      buddyUserId: input.toUserId,
      path: `/member/${input.toUserId}`,
    },
  }).catch(() => undefined);
};
