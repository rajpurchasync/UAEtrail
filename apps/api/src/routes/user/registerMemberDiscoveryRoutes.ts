import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { createActivityJoinInvite } from '../../services/activity-invite.js';
import { listBrowsablePublicMembers } from '../../services/member-discovery.js';
import { resolveMemberDiscoveryQuota } from '../../services/member-discovery-quota.js';
import { maySeeProfileViewStats } from '../../services/member-entitlements.js';
import { resolveMemberHostStatus } from '../../services/member-host-status.js';
import {
  countMemberProfileViewsSince,
  countUniqueMemberProfileViewersSince,
} from '../../lib/member-profile-views-store.js';
import { eventIdParamSchema } from './schemas.js';

const memberBrowseQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
});

const activityInviteBodySchema = z.object({
  inviteeUserId: z.string().min(1),
});

const PROFILE_VIEW_STATS_WINDOW_DAYS = 30;

/** Member discovery (Who's going), browse, quotas, Join me invites. */
export const registerMemberDiscoveryRoutes = (router: Router): void => {
  router.get('/me/member-discovery-quota', async (req, res, next) => {
    try {
      const viewerUserId = req.auth!.userId;
      const hostStatus = await resolveMemberHostStatus(viewerUserId);
      const data = await resolveMemberDiscoveryQuota(viewerUserId, hostStatus);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/users/browse',
    validate({ query: memberBrowseQuerySchema }),
    async (req, res, next) => {
      try {
        const pg = memberBrowseQuerySchema.parse(req.query);
        const data = await listBrowsablePublicMembers({
          excludeUserId: req.auth!.userId,
          search: pg.q,
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
        });

        res.json({ data, meta: { page: pg.page, pageSize: pg.pageSize } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/profile-view-stats', async (req, res, next) => {
    try {
      const viewerUserId = req.auth!.userId;
      const hostStatus = await resolveMemberHostStatus(viewerUserId);
      if (!maySeeProfileViewStats({ viewerUserId, hostStatus })) {
        throw new ApiError(
          403,
          'upgrade_required',
          'Profile view stats are available on Pro and business memberships.'
        );
      }

      const since = new Date(Date.now() - PROFILE_VIEW_STATS_WINDOW_DAYS * 86_400_000);
      const [totalViews, uniqueViewers] = await Promise.all([
        countMemberProfileViewsSince(viewerUserId, since),
        countUniqueMemberProfileViewersSince(viewerUserId, since),
      ]);

      res.json({
        data: {
          windowDays: PROFILE_VIEW_STATS_WINDOW_DAYS,
          totalViews,
          uniqueViewers,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  registerActivityRoute(
    router,
    'post',
    '/:id/invites',
    validate({ params: eventIdParamSchema, body: activityInviteBodySchema }),
    async (req, res, next) => {
      try {
        const { id: activityId } = req.params as z.infer<typeof eventIdParamSchema>;
        const { inviteeUserId } = req.body as z.infer<typeof activityInviteBodySchema>;
        const data = await createActivityJoinInvite({
          activityId,
          fromUserId: req.auth!.userId,
          toUserId: inviteeUserId,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
