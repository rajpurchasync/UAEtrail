import type { Router } from 'express';
import { z } from 'zod';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { ORG_ACTIVITY_EDIT_ROLES } from '../../lib/org-permissions.js';
import { requireMembershipRole } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { decideTenantActivityJoinRequest } from '../../services/publishing-activity-request-commands.js';
import { listTenantActivityJoinRequests } from '../../services/publishing-activity-request-read.js';
import { resolveHostNote } from '@uaetrail/shared-types';
import { activityRequestDecisionSchema, idParamSchema } from './publishing-route-schemas.js';

const hostRequestsQuerySchema = paginationSchema.extend({
  activityId: z.string().min(1).optional(),
});

/**
 * Host console queue for **activity** join requests (`activity_requests`).
 * Members ask to join a published outing; host approves/rejects — not host onboarding.
 * Publish capability: `GET /me/status` (`profileComplete` + `publish.canPublish`).
 */
export const registerPublishingActivityRequestRoutes = (publishingRouter: Router): void => {
  publishingRouter.get('/requests', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      const query = hostRequestsQuerySchema.parse(req.query);
      const { activityId, page, pageSize } = query;
      const { items, total } = await listTenantActivityJoinRequests({
        tenantId,
        skip: (page - 1) * pageSize,
        take: pageSize,
        activityId,
      });
      res.json(paginatedResponse(items, total, { page, pageSize }));
    } catch (error) {
      next(error);
    }
  });

  publishingRouter.patch(
    '/requests/:id',
    requireMembershipRole(ORG_ACTIVITY_EDIT_ROLES),
    validate({ params: idParamSchema, body: activityRequestDecisionSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof activityRequestDecisionSchema>;
        const { status: decided } = await decideTenantActivityJoinRequest({
          tenantId,
          requestId: id,
          reviewerUserId: req.auth!.userId,
          status: body.status,
          hostNote: resolveHostNote(body) ?? undefined,
        });
        res.json({ message: `Request ${decided}.` });
      } catch (error) {
        next(error);
      }
    }
  );
};
