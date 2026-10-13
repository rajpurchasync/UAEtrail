import { NotificationType } from '../domain/enums.js';
import { findActivityForRequestViewById } from '../lib/activities-store.js';
import { buildParticipantRevokedBody } from '../lib/notification-copy.js';
import { TRIPS_JOINED_TAB_PATH } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';

export const notifyParticipantRevokedByHost = async (input: {
  userId: string;
  activityId: string;
  requestId: string;
  actorUserId: string;
  organizerNote: string;
}): Promise<void> => {
  const activity = await findActivityForRequestViewById(input.activityId);
  const title = 'Removed from activity';
  const body = buildParticipantRevokedBody(activity?.title ?? 'this activity', input.organizerNote);

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
        organizerNote: input.organizerNote.trim(),
        path: TRIPS_JOINED_TAB_PATH,
      },
    },
    'activity_participant_revoked'
  );
};
