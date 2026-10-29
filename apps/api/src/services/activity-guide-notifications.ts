import { NotificationType } from '../domain/enums.js';
import { activityDetailPath } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';

export const notifyActivityGuideInvite = (input: {
  inviteeUserId: string;
  actorUserId: string;
  activityId: string;
  activityTitle: string;
}): void => {
  scheduleNotification(
    {
      userId: input.inviteeUserId,
      title: 'You’re invited to guide this outing',
      body: `Confirm if you’ll guide “${input.activityTitle}”. Pending invites stay off the public page until you accept.`,
      type: NotificationType.ACTIVITY,
      meta: {
        kind: 'activity_guide_invite',
        actorUserId: input.actorUserId,
        activityId: input.activityId,
        path: activityDetailPath(input.activityId),
      },
    },
    'activity-guide-invite'
  );
};
