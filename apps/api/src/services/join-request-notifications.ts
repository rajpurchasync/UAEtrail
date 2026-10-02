import { NotificationType } from '../domain/enums.js';
import { findActivityForRequestViewById } from '../lib/activities-store.js';
import { myRequestDetailPath, TRIPS_JOINED_TAB_PATH } from '../lib/member-routes.js';
import { dispatchNotification } from './notifications.js';

export const notifyParticipantJoinRequestSubmitted = async (input: {
  userId: string;
  activityId: string;
  requestId: string;
  waitlisted: boolean;
}): Promise<void> => {
  const activity = await findActivityForRequestViewById(input.activityId);
  const title = input.waitlisted ? 'Added to waitlist' : 'Request sent';
  const body = input.waitlisted
    ? `"${activity?.title ?? 'This activity'}" is full right now — we'll let you know when a spot opens.`
    : `Your request to join "${activity?.title ?? 'this activity'}" is with the host now.`;

  await dispatchNotification({
    userId: input.userId,
    title,
    body,
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: input.waitlisted ? 'join_request_waitlisted' : 'join_request_pending',
      activityId: input.activityId,
      requestId: input.requestId,
      path: myRequestDetailPath(input.requestId),
    },
  }).catch(() => undefined);
};

export const notifyParticipantJoinRequestWithdrawn = async (input: {
  userId: string;
  activityId: string;
  requestId: string;
  wasConfirmed: boolean;
}): Promise<void> => {
  const activity = await findActivityForRequestViewById(input.activityId);
  const title = input.wasConfirmed ? "You've left the activity" : 'Request cancelled';
  const body = input.wasConfirmed
    ? `You withdrew from "${activity?.title ?? 'this activity'}".`
    : `You cancelled your request to join "${activity?.title ?? 'this activity'}".`;

  await dispatchNotification({
    userId: input.userId,
    title,
    body,
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: 'join_request_withdrawn',
      activityId: input.activityId,
      requestId: input.requestId,
      path: TRIPS_JOINED_TAB_PATH,
    },
  }).catch(() => undefined);
};
