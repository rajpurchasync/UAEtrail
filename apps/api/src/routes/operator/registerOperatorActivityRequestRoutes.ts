import type { Router } from 'express';
import { z } from 'zod';
import { NotificationType, RequestStatus } from '../../domain/enums.js';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import {
  applyTenantActivityRequestDecision,
  countTenantActivityRequests,
  findTenantActivityRequestForDecision,
  listTenantActivityRequestsDetailed,
} from '../../lib/activity-engagement-store.js';
import { notifyRequestDecision } from '../../lib/email.js';
import { buildJoinApprovedBody, buildJoinRejectedBody } from '../../lib/notification-copy.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { requireOrgRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { ensureActivityGroupChat } from '../../services/activity-group-chat.js';
import { activityDetailJoinedWelcomePath, TRIPS_JOINED_TAB_PATH } from '../../lib/member-routes.js';
import { scheduleSideEffect } from '../../lib/schedule-side-effect.js';
import { dispatchNotification } from '../../services/notifications.js';
import { activityRequestDecisionSchema, idParamSchema } from './operator-route-schemas.js';

const hostRequestsQuerySchema = paginationSchema.extend({
  activityId: z.string().min(1).optional(),
});

/**
 * Host console queue for **activity** join requests (`activity_requests`).
 * Members ask to join a published outing; host approves/rejects — not host onboarding.
 * Publish capability: `GET /me/status` (`profileComplete` + `publish.canPublish`).
 */
export const registerOperatorActivityRequestRoutes = (operatorRouter: Router): void => {
  operatorRouter.get('/requests', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const query = hostRequestsQuerySchema.parse(req.query);
      const { activityId, page, pageSize } = query;
      const [requests, total] = await Promise.all([
        listTenantActivityRequestsDetailed({
          tenantId,
          skip: (page - 1) * pageSize,
          take: pageSize,
          activityId,
        }),
        countTenantActivityRequests(tenantId, activityId),
      ]);
      res.json(
        paginatedResponse(
          requests.map((request) => ({
            id: request.id,
            status: request.status.toLowerCase(),
            note: request.note,
            organizerNote: request.organizerNote,
            cancelReason: request.cancelReason,
            cancelMessage: request.cancelMessage,
            cancelledAt: request.cancelledAt,
            createdAt: request.createdAt,
            user: {
              id: request.user.id,
              email: request.user.email,
              displayName: request.user.profile?.displayName ?? request.user.email,
            },
            activity: (() => {
              const startAt = request.activity.startAt;
              const startIso =
                startAt instanceof Date
                  ? startAt.toISOString()
                  : startAt
                    ? String(startAt)
                    : undefined;
              return {
                id: request.activity.id,
                title: request.activity.title,
                locationName: request.activity.location.name,
                startAt: startIso,
                date: startIso?.slice(0, 10),
              };
            })(),
          })),
          total,
          { page, pageSize }
        )
      );
    } catch (error) {
      next(error);
    }
  });

  operatorRouter.patch(
    '/requests/:id',
    requireOrgRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema, body: activityRequestDecisionSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, organizerNote } = req.body as z.infer<typeof activityRequestDecisionSchema>;

        const request = await findTenantActivityRequestForDecision(id, tenantId);

        if (!request) {
          throw new ApiError(404, 'request_not_found', 'Join request not found.');
        }
        if (request.status !== RequestStatus.PENDING) {
          throw new ApiError(400, 'request_finalized', 'Only pending requests can be processed.');
        }

        if (status === 'approved') {
          await applyTenantActivityRequestDecision({
            requestId: request.id,
            activityId: request.activityId,
            userId: request.userId,
            reviewerId: req.auth!.userId,
            decision: 'approved',
            organizerNote,
          });

          const groupId = await ensureActivityGroupChat(request.activityId);

          await dispatchNotification({
            userId: request.userId,
            title: "You're in!",
            body: buildJoinApprovedBody(organizerNote),
            type: NotificationType.REQUEST_UPDATE,
            meta: {
              kind: 'join_request_approved',
              activityId: request.activityId,
              requestId: request.id,
              groupId: groupId ?? null,
              actorUserId: req.auth!.userId,
              organizerNote: organizerNote?.trim() || null,
              path: activityDetailJoinedWelcomePath(request.activityId),
            },
          });
        } else {
          await applyTenantActivityRequestDecision({
            requestId: request.id,
            activityId: request.activityId,
            userId: request.userId,
            reviewerId: req.auth!.userId,
            decision: 'rejected',
            organizerNote,
          });

          await dispatchNotification({
            userId: request.userId,
            title: 'Update on your activity request',
            body: buildJoinRejectedBody(organizerNote),
            type: NotificationType.REQUEST_UPDATE,
            meta: {
              kind: 'join_request_rejected',
              activityId: request.activityId,
              requestId: request.id,
              actorUserId: req.auth!.userId,
              organizerNote: organizerNote?.trim() || null,
              path: TRIPS_JOINED_TAB_PATH,
            },
          });
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: `request.${status}`,
          entityType: 'activity_request',
          entityId: request.id,
          tenantId,
        });

        const userName = request.user.profile?.displayName ?? request.user.email.split('@')[0];
        const activityDate = request.activity.startAt.toISOString().slice(0, 10);
        scheduleSideEffect(
          notifyRequestDecision({
            to: request.user.email,
            userName,
            activityTitle: request.activity.title,
            activityDate,
            approved: status === 'approved',
            note: organizerNote,
          }),
          'host.request_decision_email'
        );

        res.json({ message: `Request ${status}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
