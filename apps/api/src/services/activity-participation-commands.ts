import { ActivityStatus, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findPublishedActivityWithPreviewsById, findActivityForRequestViewById } from '../lib/activities-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  cancelUserActivityRequestAndPromoteWaitlist,
  findActivityRequestByIdForUser,
  updateActivityRequestNote,
} from '../lib/activity-engagement-store.js';
import { markNotificationsReadForCancelledJoinRequest } from '../lib/notifications-store.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../lib/withdraw-reasons.js';
import type { z } from 'zod';

type WithdrawReason = z.infer<typeof withdrawReasonSchema>['reason'];
import { buildParticipationDto } from './checkin.js';
import { createJoinOrWaitlistRequest, createRsvpParticipation } from './join-request.js';
import {
  notifyParticipantJoinRequestSubmitted,
  notifyParticipantJoinRequestWithdrawn,
} from './join-request-notifications.js';
import { PRIVATE_ACTIVITY_MESSAGE } from './activity-viewer-access.js';
import { composeActivityViewerAccess } from './compose-activity-viewer-access.js';
import { resolveMemberStatus } from './member-status.js';
import { notifyHostOfRequestWithdrawal } from './request-notifications.js';

export const assertPrivateActivityJoinAllowed = async (input: {
  activityId: string;
  viewerUserId: string;
  isPlatformAdmin: boolean;
}): Promise<void> => {
  const event = await findPublishedActivityWithPreviewsById(input.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const hostStatus = await resolveMemberStatus(input.viewerUserId);
  const access = await composeActivityViewerAccess(
    {
      viewerUserId: input.viewerUserId,
      activity: {
        id: event.id,
        tenantId: event.tenantId,
        hostId: event.hostId,
        createdById: event.createdById,
        joinMode: event.joinMode,
        requirements: event.requirements,
      },
      isPlatformAdmin: input.isPlatformAdmin,
    },
    { viewerUserId: input.viewerUserId, hostStatus },
    {
      hostUserId: event.createdById ?? event.hostId ?? null,
      participantUserIds: event.participants.map((row) => row.userId),
    }
  );
  if (access.joinMode === 'private' && !access.canOpenDetailPage) {
    throw new ApiError(403, 'activity_invite_only', PRIVATE_ACTIVITY_MESSAGE);
  }
};

export const submitPublicActivityJoinRequest = async (input: {
  activityId: string;
  userId: string;
  isPlatformAdmin: boolean;
  note?: string | null;
}) => {
  await assertPrivateActivityJoinAllowed({
    activityId: input.activityId,
    viewerUserId: input.userId,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const { request, waitlisted } = await createJoinOrWaitlistRequest({
    activityId: input.activityId,
    userId: input.userId,
    note: input.note ?? undefined,
  });

  void notifyParticipantJoinRequestSubmitted({
    userId: input.userId,
    activityId: input.activityId,
    requestId: request.id,
    waitlisted,
  });

  return {
    id: request.id,
    activityId: request.activityId,
    userId: request.userId,
    status: request.status.toLowerCase(),
    waitlisted,
    note: request.note,
    organizerNote: request.organizerNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};

export const submitPublicActivityRsvp = async (input: {
  activityId: string;
  userId: string;
  isPlatformAdmin: boolean;
}) => {
  await assertPrivateActivityJoinAllowed({
    activityId: input.activityId,
    viewerUserId: input.userId,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const { request, participation } = await createRsvpParticipation({
    activityId: input.activityId,
    userId: input.userId,
  });

  const eventDoc = await findActivityDocInMongo(input.activityId);
  const participationDto = eventDoc
    ? buildParticipationDto(eventDoc, participation)
    : buildParticipationDto(
        { startAt: new Date(), endAt: null, status: ActivityStatus.PUBLISHED },
        participation
      );

  return {
    request: {
      id: request.id,
      activityId: request.activityId,
      userId: request.userId,
      status: request.status.toLowerCase(),
      note: request.note,
      organizerNote: request.organizerNote,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    },
    participation: participationDto,
  };
};

export const cancelPublicActivityJoinRequest = async (input: {
  requestId: string;
  userId: string;
  reason: WithdrawReason;
  message?: string | null;
}) => {
  const request = await findActivityRequestByIdForUser(input.requestId, input.userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  if (!canWithdrawRequest(request.status.toLowerCase())) {
    throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
  }

  const wasConfirmed = request.status.toLowerCase() === 'approved';

  await cancelUserActivityRequestAndPromoteWaitlist({
    requestId: request.id,
    activityId: request.activityId,
    userId: input.userId,
    cancelReason: input.reason,
    cancelMessage: input.message?.trim() || null,
  });

  if (!wasConfirmed) {
    const activity = await findActivityForRequestViewById(request.activityId);
    const hostUserId = activity?.hostId ?? activity?.createdById;
    if (hostUserId) {
      void markNotificationsReadForCancelledJoinRequest({
        hostUserId,
        activityId: request.activityId,
        requestId: request.id,
      });
    }
  }

  void notifyHostOfRequestWithdrawal({
    wasConfirmed,
    activityId: request.activityId,
    requestId: request.id,
    participantUserId: input.userId,
    cancelReason: input.reason,
    cancelMessage: input.message?.trim() || null,
  });

  void notifyParticipantJoinRequestWithdrawn({
    userId: input.userId,
    activityId: request.activityId,
    requestId: request.id,
    wasConfirmed,
  });
};

export const updatePublicActivityJoinRequestNote = async (input: {
  requestId: string;
  userId: string;
  note: string;
}) => {
  const request = await findActivityRequestByIdForUser(input.requestId, input.userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
  }
  const updated = await updateActivityRequestNote(request.id, input.note);
  return { id: updated.id, note: updated.note };
};
