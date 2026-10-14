import type { Router } from 'express';
import { z } from 'zod';
import { ActivityStatus, RequestStatus } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import {
  findPublishedActivityWithPreviewsById,
  listFeaturedPublishedActivities,
  listPublishedActivitiesWithPreviews,
} from '../../lib/activities-store.js';
import { findActivityDocInMongo } from '../../lib/entity-sync.js';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import {
  cancelUserActivityRequestAndPromoteWaitlist,
  findActivityRequestByEventAndUser,
  findActivityRequestByIdForUser,
  updateActivityRequestNote,
} from '../../lib/activity-engagement-store.js';
import {
  buildActivityDto,
  toLocationDto,
  toParticipantPreviews,
} from '../../lib/mappers.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../../lib/withdraw-reasons.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { buildParticipationDto } from '../../services/checkin.js';
import { createJoinOrWaitlistRequest, createRsvpParticipation } from '../../services/join-request.js';
import {
  notifyParticipantJoinRequestSubmitted,
  notifyParticipantJoinRequestWithdrawn,
} from '../../services/join-request-notifications.js';
import { findActivityForRequestViewById } from '../../lib/activities-store.js';
import { markNotificationsReadForCancelledJoinRequest } from '../../lib/notifications-store.js';
import { notifyHostOfRequestWithdrawal } from '../../services/request-notifications.js';
import { buildActivityRedactedDetail } from '../../lib/activity-redacted-detail.js';
import { PRIVATE_ACTIVITY_MESSAGE } from '../../services/activity-viewer-access.js';
import { composeActivityViewerAccess } from '../../services/compose-activity-viewer-access.js';
import { buildActivityPresentationForDetail } from '../../lib/build-activity-presentation.js';
import { countPendingActivityInvitesForSenderOnActivity } from '../../lib/activity-invites-store.js';
import { resolveMemberStatus } from '../../services/member-status.js';
import { resolveViewerPendingJoinInvite } from '../../services/activity-invite.js';
import { createRequestSchema, eventIdParamSchema, requestIdParamSchema, rsvpSchema } from './schemas.js';

const updateRequestNoteSchema = z.object({
  note: z.string().max(500),
});

/** Public activity browse, detail, join request, and RSVP. */
export const registerPublicActivityRoutes = (router: Router): void => {
registerActivityRoute(router, 'get', '/featured', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const events = await listFeaturedPublishedActivities(limit);
    res.json({
      data: events.map((event) => buildActivityDto(event))
    });
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(router, 'get', '', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const whenRaw = typeof req.query.when === 'string' ? req.query.when : 'upcoming';
    const when = whenRaw === 'past' || whenRaw === 'all' ? whenRaw : 'upcoming';
    const { items: events, total } = await listPublishedActivitiesWithPreviews({
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      when
    });

    res.json(paginatedResponse(
      events.map((event) => buildActivityDto(event)),
      total,
      pg
    ));
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(router, 'get', '/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const event = await findPublishedActivityWithPreviewsById(id);

    if (!event) {
      throw new ApiError(404, 'activity_not_found', 'Activity not found.');
    }

    const viewerUserId = req.auth?.userId ?? null;
    const hostUserId = event.createdById ?? event.hostId ?? null;
    const participantUserIds = event.participants.map((row) => row.userId);
    const hostStatus = viewerUserId ? await resolveMemberStatus(viewerUserId) : null;

    const access = await composeActivityViewerAccess(
      {
        viewerUserId,
        activity: {
          id: event.id,
          tenantId: event.tenantId,
          hostId: event.hostId,
          createdById: event.createdById,
          joinMode: event.joinMode,
          requirements: event.requirements,
        },
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
      },
      { viewerUserId, hostStatus },
      viewerUserId ? { hostUserId, participantUserIds } : undefined
    );

    let myParticipation = null;
    let myRequest = null;
    let myJoinInvite = null;
    if (req.auth?.userId) {
      const mine = event.participants.find((p) => p.userId === req.auth!.userId);
      if (mine) {
        myParticipation = buildParticipationDto(event, mine);
      }
      const requestRow = await findActivityRequestByEventAndUser(id, req.auth.userId);
      if (requestRow) {
        const status = requestRow.status.toLowerCase();
        myRequest = {
          id: requestRow.id,
          status,
          canWithdraw: canWithdrawRequest(status)
        };
      }
      if (!myParticipation) {
        myJoinInvite = await resolveViewerPendingJoinInvite(id, req.auth.userId);
      }
    }

    const pendingJoinInviteCount =
      viewerUserId != null
        ? await countPendingActivityInvitesForSenderOnActivity({
            activityId: id,
            fromUserId: viewerUserId,
          })
        : 0;

    const presentation = buildActivityPresentationForDetail({
      event,
      viewerAccess: access,
      viewerUserId,
      myParticipation,
      myRequest: myRequest
        ? { status: myRequest.status, canWithdraw: myRequest.canWithdraw }
        : null,
      pendingJoinInviteCount,
    });

    if (access.exposure === 'none') {
      res.json({
        data: {
          id: event.id,
          joinMode: 'private',
          message: PRIVATE_ACTIVITY_MESSAGE,
        },
        viewerAccess: access,
        presentation,
      });
      return;
    }

    if (access.exposure === 'redacted') {
      res.json({
        data: {
          ...buildActivityRedactedDetail(event),
          myParticipation,
          myRequest,
          myJoinInvite,
        },
        viewerAccess: access,
        presentation,
      });
      return;
    }

    let linkedRideshare = null;
    if (event.linkedRideshareActivityId) {
      const linkedEvent = await findPublishedActivityWithPreviewsById(event.linkedRideshareActivityId);
      if (linkedEvent) {
        linkedRideshare = buildActivityDto(linkedEvent);
      }
    }

    let linkedParentActivity = null;
    if (event.linkedActivityId) {
      const parentEvent = await findPublishedActivityWithPreviewsById(event.linkedActivityId);
      if (parentEvent) {
        linkedParentActivity = {
          id: parentEvent.id,
          title: parentEvent.title,
          activityType: buildActivityDto(parentEvent).activityType,
        };
      }
    }

    res.json({
      data: {
        ...buildActivityDto(event),
        linkedRideshare,
        linkedParentActivity,
        organizerId: event.hostId ?? event.tenant.ownerId,
        participants: toParticipantPreviews(event.participants),
        location: toLocationDto(event.location),
        myParticipation,
        myRequest,
        myJoinInvite,
      },
      viewerAccess: access,
      presentation,
    });
  } catch (error) {
    next(error);
  }
});

registerActivityRoute(
  router,
  'post',
  '/:id/requests',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: eventIdParamSchema, body: createRequestSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const { note } = req.body as z.infer<typeof createRequestSchema>;

      const { request, waitlisted } = await createJoinOrWaitlistRequest({
        activityId: id,
        userId: req.auth!.userId,
        note,
      });

      void notifyParticipantJoinRequestSubmitted({
        userId: req.auth!.userId,
        activityId: id,
        requestId: request.id,
        waitlisted
      });

      res.status(201).json({
        data: {
          id: request.id,
          activityId: request.activityId,
          userId: request.userId,
          status: request.status.toLowerCase(),
          waitlisted,
          note: request.note,
          organizerNote: request.organizerNote,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

registerActivityRoute(
  router,
  'post',
  '/:id/rsvp',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: eventIdParamSchema, body: rsvpSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const { request, participation } = await createRsvpParticipation({
        activityId: id,
        userId: req.auth!.userId,
      });

      const eventDoc = await findActivityDocInMongo(id);
      const participationDto = eventDoc
        ? buildParticipationDto(eventDoc, participation)
        : buildParticipationDto(
            { startAt: new Date(), endAt: null, status: ActivityStatus.PUBLISHED },
            participation
          );

      res.status(201).json({
        data: {
          request: {
            id: request.id,
            activityId: request.activityId,
            userId: request.userId,
            status: request.status.toLowerCase(),
            note: request.note,
            organizerNote: request.organizerNote,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
          },
          participation: participationDto
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

registerActivityRoute(
  router,
  'patch',
  '/:id/requests/:requestId/cancel',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: withdrawReasonSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { reason, message } = req.body as z.infer<typeof withdrawReasonSchema>;
      const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
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
        userId: req.auth!.userId,
        cancelReason: reason,
        cancelMessage: message?.trim() || null
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
        participantUserId: req.auth!.userId,
        cancelReason: reason,
        cancelMessage: message?.trim() || null,
      });

      void notifyParticipantJoinRequestWithdrawn({
        userId: req.auth!.userId,
        activityId: request.activityId,
        requestId: request.id,
        wasConfirmed
      });

      res.json({ message: 'Request cancelled successfully.' });
    } catch (error) {
      next(error);
    }
  }
);

registerActivityRoute(
  router,
  'patch',
  '/:id/requests/:requestId',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: requestIdParamSchema, body: updateRequestNoteSchema }),
  async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof requestIdParamSchema>;
      const { note } = req.body as z.infer<typeof updateRequestNoteSchema>;
      const request = await findActivityRequestByIdForUser(requestId, req.auth!.userId);
      if (!request) {
        throw new ApiError(404, 'request_not_found', 'Request not found.');
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
      }
      const updated = await updateActivityRequestNote(request.id, note);
      res.json({ data: { id: updated.id, note: updated.note } });
    } catch (error) {
      next(error);
    }
  }
);
};
