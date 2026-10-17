import { NotificationType, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import {
  applyTenantActivityRequestDecision,
  findTenantActivityRequestForDecision,
} from '../lib/activity-engagement-store.js';
import { createAuditLog } from '../lib/audit.js';
import { notifyRequestDecision } from '../lib/email.js';
import { activityDetailJoinedWelcomePath, TRIPS_JOINED_TAB_PATH } from '../lib/member-routes.js';
import { buildJoinApprovedBody, buildJoinRejectedBody } from '../lib/notification-copy.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { ensureActivityGroupChat } from './activity-group-chat.js';
import { dispatchNotification } from './notifications.js';

export const decideTenantActivityJoinRequest = async (input: {
  tenantId: string;
  requestId: string;
  reviewerUserId: string;
  status: 'approved' | 'rejected';
  organizerNote?: string;
}) => {
  const request = await findTenantActivityRequestForDecision(input.requestId, input.tenantId);

  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Join request not found.');
  }
  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
  }

  if (input.status === 'approved') {
    await applyTenantActivityRequestDecision({
      requestId: request.id,
      activityId: request.activityId,
      userId: request.userId,
      reviewerId: input.reviewerUserId,
      decision: 'approved',
      organizerNote: input.organizerNote,
    });

    const groupId = await ensureActivityGroupChat(request.activityId);

    await dispatchNotification({
      userId: request.userId,
      title: "You're in!",
      body: buildJoinApprovedBody(input.organizerNote),
      type: NotificationType.REQUEST_UPDATE,
      meta: {
        kind: 'join_request_approved',
        activityId: request.activityId,
        requestId: request.id,
        groupId: groupId ?? null,
        actorUserId: input.reviewerUserId,
        organizerNote: input.organizerNote?.trim() || null,
        path: activityDetailJoinedWelcomePath(request.activityId),
      },
    });
  } else {
    await applyTenantActivityRequestDecision({
      requestId: request.id,
      activityId: request.activityId,
      userId: request.userId,
      reviewerId: input.reviewerUserId,
      decision: 'rejected',
      organizerNote: input.organizerNote,
    });

    await dispatchNotification({
      userId: request.userId,
      title: 'Update on your activity request',
      body: buildJoinRejectedBody(input.organizerNote),
      type: NotificationType.REQUEST_UPDATE,
      meta: {
        kind: 'join_request_rejected',
        activityId: request.activityId,
        requestId: request.id,
        actorUserId: input.reviewerUserId,
        organizerNote: input.organizerNote?.trim() || null,
        path: TRIPS_JOINED_TAB_PATH,
      },
    });
  }

  await createAuditLog({
    actorId: input.reviewerUserId,
    action: `request.${input.status}`,
    entityType: 'activity_request',
    entityId: request.id,
    tenantId: input.tenantId,
  });

  const userName = request.user.profile?.displayName ?? request.user.email.split('@')[0];
  const activityDate = request.activity.startAt.toISOString().slice(0, 10);
  scheduleSideEffect(
    notifyRequestDecision({
      to: request.user.email,
      userName,
      activityTitle: request.activity.title,
      activityDate,
      approved: input.status === 'approved',
      note: input.organizerNote,
    }),
    'host.request_decision_email'
  );

  return { status: input.status };
};
