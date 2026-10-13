import { NotificationType } from '../domain/enums.js';
import { explorePublishedActivityPinPath, planSelfDemandPeekPath } from '../lib/member-routes.js';
import { scheduleNotification } from './notifications.js';

export const notifyDemandJoinRequestSubmitted = async (input: {
  requesterUserId: string;
  hostUserId: string;
  intentId: string;
  intentTitle: string;
  requestId: string;
  activityId?: string | null;
}): Promise<void> => {
  scheduleNotification({
    userId: input.hostUserId,
    title: 'Someone wants to join your plan',
    body: `Review their request for "${input.intentTitle}".`,
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: 'demand_join_request_pending',
      intentId: input.intentId,
      requestId: input.requestId,
      actorUserId: input.requesterUserId,
      path: planSelfDemandPeekPath(input.intentId),
    },
  }, 'demand_join_notification');

  scheduleNotification({
    userId: input.requesterUserId,
    title: 'Request sent',
    body: `Your request to join "${input.intentTitle}" is with the host now.`,
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: 'demand_join_request_pending',
      intentId: input.intentId,
      requestId: input.requestId,
      path: explorePublishedActivityPinPath({
        intentId: input.intentId,
        activityId: input.activityId,
      }),
    },
  }, 'demand_join_notification');
};

export const notifyDemandJoinRequestDecided = async (input: {
  requesterUserId: string;
  intentTitle: string;
  intentId: string;
  requestId: string;
  approved: boolean;
  activityId?: string | null;
}): Promise<void> => {
  scheduleNotification({
    userId: input.requesterUserId,
    title: input.approved ? 'You’re in' : 'Update on your request',
    body: input.approved
      ? `You’re approved to join "${input.intentTitle}". Message the host to coordinate.`
      : `Your request to join "${input.intentTitle}" wasn’t accepted this time.`,
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: input.approved ? 'demand_join_request_approved' : 'demand_join_request_rejected',
      intentId: input.intentId,
      requestId: input.requestId,
      path: explorePublishedActivityPinPath({
        intentId: input.intentId,
        activityId: input.activityId,
      }),
    },
  }, 'demand_join_notification');
};
