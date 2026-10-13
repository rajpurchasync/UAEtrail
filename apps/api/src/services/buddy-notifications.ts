import { NotificationType } from '../domain/enums.js';
import { scheduleNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyBuddyRequestReceived = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const senderName = await resolveNotificationActorDisplayName(input.fromUserId, input.toUserId);

  scheduleNotification(
    {
      userId: input.toUserId,
      title: 'Buddy request',
      body: `${senderName} wants to connect with you on UAE Trail.`,
      type: NotificationType.SYSTEM,
      meta: {
        kind: 'connection_buddy_request',
        requestId: input.requestId,
        actorUserId: input.fromUserId,
        path: `/member/${input.fromUserId}`,
      },
    },
    'connection_buddy_request'
  );
};

export const notifyBuddyRequestAccepted = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const accepterName = await resolveNotificationActorDisplayName(input.toUserId, input.fromUserId);

  scheduleNotification(
    {
      userId: input.fromUserId,
      title: 'Buddy request accepted',
      body: `${accepterName} accepted your buddy request.`,
      type: NotificationType.SYSTEM,
      meta: {
        kind: 'connection_buddy_accepted',
        requestId: input.requestId,
        actorUserId: input.toUserId,
        path: `/member/${input.toUserId}`,
      },
    },
    'connection_buddy_accepted'
  );
};
