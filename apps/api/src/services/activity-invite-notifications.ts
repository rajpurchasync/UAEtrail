import { activityDetailInvitePath } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findPublishedActivityWithPreviewsById } from '../lib/activities-store.js';
import { buildActivityJoinInviteNotificationCopy } from '../lib/activity-join-invite-copy.js';
import { dispatchNotification } from './notifications.js';
import { resolveNotificationActorDisplayName } from './notification-actor-label.js';

export const notifyActivityJoinInvite = async (input: {
  activityId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> => {
  const activity = await findPublishedActivityWithPreviewsById(input.activityId);
  const inviterName = await resolveNotificationActorDisplayName(input.fromUserId, input.toUserId);
  const { title, body } = buildActivityJoinInviteNotificationCopy({
    inviterDisplayName: inviterName,
    activity: activity
      ? { title: activity.title, activityType: activity.activityType, startAt: activity.startAt }
      : null,
  });

  await dispatchNotification({
    userId: input.toUserId,
    title,
    body,
    type: NotificationType.SYSTEM,
    meta: {
      kind: 'activity_join_invite',
      actorUserId: input.fromUserId,
      activityId: input.activityId,
      path: activityDetailInvitePath(input.activityId),
    },
  }).catch(() => undefined);
};
