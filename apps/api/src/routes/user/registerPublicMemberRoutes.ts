import type { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import {
  listPublicMemberUpcomingActivities,
  loadPublicMemberBrief,
  loadPublicMemberProfilePage,
} from '../../services/member-public-read.js';
import { userBriefParamSchema } from './schemas.js';

/** Public member brief + profile (`/member/:id`). */
export const registerPublicMemberRoutes = (router: Router): void => {
  router.get('/member/:userId/brief', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
    try {
      const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
      const data = await loadPublicMemberBrief({
        userId,
        viewerUserId: req.auth?.userId ?? null,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/member/:userId/profile', optionalAuth, validate({ params: userBriefParamSchema }), async (req, res, next) => {
    try {
      const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
      const fromDiscover =
        req.query.from === 'discover' || req.query.discover === '1' || req.query.discover === 'true';
      const payload = await loadPublicMemberProfilePage({
        userId,
        viewerUserId: req.auth?.userId ?? null,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        fromDiscover,
      });
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/member/:userId/upcoming-activities',
    optionalAuth,
    validate({ params: userBriefParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
        const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
        const data = await listPublicMemberUpcomingActivities({
          userId,
          viewerUserId: req.auth?.userId ?? null,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
          limit,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
