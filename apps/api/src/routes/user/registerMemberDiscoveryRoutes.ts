import type { Router } from 'express';
import { z } from 'zod';
import { paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  listBrowsableMembersForViewer,
  loadMyProfileViewStats,
} from '../../services/member-discovery-me-read.js';
import { resolveMemberDiscoveryQuota } from '../../services/member-discovery-quota.js';
import { loadMemberDiscoveryRoster } from '../../services/member-discovery-roster.js';
import { resolveMemberStatus } from '../../services/member-status.js';

const memberBrowseQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
});

const memberDiscoveryRosterQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  date: z.string().trim().max(32).optional(),
  omitDirectory: z.literal('1').optional(),
});

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
      const hostStatus = await resolveMemberStatus(viewerUserId);
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
        const data = await listBrowsableMembersForViewer({
          viewerUserId,
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
      const hostStatus = await resolveMemberStatus(viewerUserId);
      const data = await loadMyProfileViewStats({ viewerUserId, hostStatus });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
