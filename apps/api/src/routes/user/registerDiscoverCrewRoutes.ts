import type { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { loadDiscoverCrewFeed } from '../../services/discover-crew-feed.js';

const discoverCrewQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  date: z.string().trim().max(32).optional(),
  omitDirectory: z.literal('1').optional(),
});

/** Discover layer — federated Find crew feed (`GET /discover/crew`). Guests get public directory only. */
export const registerDiscoverCrewRoutes = (router: Router): void => {
  router.get(
    '/discover/crew',
    optionalAuth,
    validate({ query: discoverCrewQuerySchema }),
    async (req, res, next) => {
      try {
        const pg = discoverCrewQuerySchema.parse(req.query);
        const viewerUserId = req.auth?.userId ?? null;
        const { data, quota } = await loadDiscoverCrewFeed({
          viewerUserId,
          userRole: req.auth?.role ?? null,
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
};