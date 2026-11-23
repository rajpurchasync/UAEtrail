import { NotificationType } from '../domain/enums.js';
import { findActivityForRequestViewById } from '../lib/activities-store.js';
import { buildParticipantRevokedBody } from '../lib/notification-copy.js';
import { planJoinedSchedulePath } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';

export const notifyParticipantRevokedByHost = async (input: {
  userId: string;
  activityId: string;
  requestId: string;
  actorUserId: string;
  hostNote: string;
}): Promise<void> => {
  const activity = await findActivityForRequestViewById(input.activityId);
  const title = 'Removed from activity';
  const body = buildParticipantRevokedBody(activity?.title ?? 'this activity', input.hostNote);

  scheduleNotification(
    {
      userId: input.userId,
      title,
      body,
      type: NotificationType.REQUEST_UPDATE,
      meta: {
        kind: 'activity_participant_revoked',
        activityId: input.activityId,
        requestId: input.requestId,
        actorUserId: input.actorUserId,
        hostNote: input.hostNote.trim(),
        path: planJoinedSchedulePath(),
      },
    },
    'activity_participant_revoked'
  );
};
