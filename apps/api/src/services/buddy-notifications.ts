import { NotificationType } from '../domain/enums.js';
import { dispatchNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyBuddyRequestReceived = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const senderName = await resolveNotificationActorDisplayName(input.fromUserId, input.toUserId);

  await dispatchNotification({
    userId: input.toUserId,
    title: 'Buddy request',
    body: `${senderName} wants to connect with you on UAE Trail.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'connection_buddy_request',
      requestId: input.requestId,
      /** Member who sent the request (profile link target). */
      actorUserId: input.fromUserId,
      path: `/member/${input.fromUserId}`,
    },
  }).catch(() => undefined);
};

export const notifyBuddyRequestAccepted = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const accepterName = await resolveNotificationActorDisplayName(input.toUserId, input.fromUserId);

  await dispatchNotification({
    userId: input.fromUserId,
    title: 'Buddy request accepted',
    body: `${accepterName} accepted your buddy request.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'connection_buddy_accepted',
      requestId: input.requestId,
      /** Member who accepted (now connected — same id as in `BuddySummaryDTO.userId`). */
      actorUserId: input.toUserId,
      path: `/member/${input.toUserId}`,
    },
  }).catch(() => undefined);
};
