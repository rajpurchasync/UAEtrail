import { NotificationType } from '../domain/enums.js';
import { findAuthUserById } from '../lib/auth-users-store.js';
import { findActivityForRequestViewById } from '../lib/activities-store.js';
import { planHostedSchedulePath } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';

/** Host only needs a withdrawal notice after the joiner was already on the roster. */
export const notifyHostOfRequestWithdrawal = async (input: {
  wasConfirmed: boolean;
  activityId: string;
  requestId: string;
  participantUserId: string;
  cancelReason: string;
  cancelMessage: string | null;
}): Promise<void> => {
  if (!input.wasConfirmed) {
    return;
  }

  const [activity, participant] = await Promise.all([
    findActivityForRequestViewById(input.activityId),
    findAuthUserById(input.participantUserId)
  ]);

  if (!activity) return;

  const hostUserId = activity.hostId ?? activity.createdById;
  if (!hostUserId || hostUserId === input.participantUserId) return;

  const participantName = participant?.profile.displayName ?? participant?.email ?? 'A participant';

  scheduleNotification(
    {
      userId: hostUserId,
      title: 'Participant withdrew',
      body: `${participantName} withdrew from "${activity.title}".`,
      type: NotificationType.REQUEST_UPDATE,
      meta: {
        kind: 'request_withdrawal',
        activityId: input.activityId,
        requestId: input.requestId,
        actorUserId: input.participantUserId,
        cancelReason: input.cancelReason,
        cancelMessage: input.cancelMessage,
        path: planHostedSchedulePath(),
      },
    },
    'request_withdrawal'
  );
};
