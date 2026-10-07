import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { listBuddiesForUser } from '../../lib/buddy-store.js';
import { listBrowsablePublicMembers } from '../../services/member-discovery.js';
import { resolveMemberDiscoveryQuota } from '../../services/member-discovery-quota.js';
import { loadMemberDiscoveryRoster } from '../../services/member-discovery-roster.js';
import { maySeeProfileViewStats } from '../../services/member-entitlements.js';
import { resolveMemberHostStatus } from '../../services/member-host-status.js';
import {
  countMemberProfileViewsSince,
  countUniqueMemberProfileViewersSince,
} from '../../lib/member-profile-views-store.js';
const memberBrowseQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
});

const memberDiscoveryRosterQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  date: z.string().trim().max(32).optional(),
  omitDirectory: z.literal('1').optional(),
});

const PROFILE_VIEW_STATS_WINDOW_DAYS = 30;

/** Member discovery roster, browse directory, quotas (not activity invites — see registerActivityJoinInviteRoutes). */
export const registerMemberDiscoveryRoutes = (router: Router): void => {
  router.get(
    '/me/member-discovery/roster',
    validate({ query: memberDiscoveryRosterQuerySchema }),
    async (req, res, next) => {
      try {
        const pg = memberDiscoveryRosterQuerySchema.parse(req.query);
        const { data, quota } = await loadMemberDiscoveryRoster({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
          datePresetRaw: pg.date,
          search: pg.q,
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
          omitDirectory: pg.omitDirectory === '1',
        });
        res.json({
          data,
          meta: { page: pg.page, pageSize: pg.pageSize, quota },
        });
      } catch (error) {
        next(error);
      }
    }
  );

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
        const viewerUserId = req.auth!.userId;
        const buddies = await listBuddiesForUser(viewerUserId);
        const excludeUserIds = new Set<string>([viewerUserId]);
        for (const buddy of buddies) {
          if (buddy.userId) excludeUserIds.add(buddy.userId);
        }
        const data = await listBrowsablePublicMembers({
          excludeUserId: viewerUserId,
          excludeUserIds,
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
};
