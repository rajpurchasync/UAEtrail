import { NotificationType } from '../domain/enums.js';
import { scheduleNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyFriendRequestReceived = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const senderName = await resolveNotificationActorDisplayName(input.fromUserId, input.toUserId);

  scheduleNotification(
    {
      userId: input.toUserId,
      title: 'Friend request',
      body: `${senderName} wants to connect with you on UAE Trail.`,
      type: NotificationType.SYSTEM,
      meta: {
        kind: 'connection_friend_request',
        requestId: input.requestId,
        actorUserId: input.fromUserId,
        path: `/member/${input.fromUserId}`,
      },
    },
    'connection_friend_request'
  );
};

export const notifyFriendRequestAccepted = async (input: {
  requestId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const accepterName = await resolveNotificationActorDisplayName(input.toUserId, input.fromUserId);

  scheduleNotification(
    {
      userId: input.fromUserId,
      title: 'Friend request accepted',
      body: `${accepterName} accepted your friend request.`,
      type: NotificationType.SYSTEM,
      meta: {
        kind: 'connection_friend_accepted',
        requestId: input.requestId,
        actorUserId: input.toUserId,
        path: `/member/${input.toUserId}`,
      },
    },
    'connection_friend_accepted'
  );
};
