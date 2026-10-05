import { activityDetailInvitePath } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { dispatchNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyActivityJoinInvite = async (input: {
  activityId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const activity = await findPublishedActivityWithPreviewsById(input.activityId);
  const title = activity?.title ?? 'an outing';
  const inviterName = await resolveNotificationActorDisplayName(input.fromUserId, input.toUserId);

  await dispatchNotification({
    userId: input.toUserId,
    title: 'Join me outside',
    body: `${inviterName} invited you to join ${title}.`,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'activity_join_invite',
      actorUserId: input.fromUserId,
      activityId: input.activityId,
      path: activityDetailInvitePath(input.activityId),
    },
  }).catch(() => undefined);
};
