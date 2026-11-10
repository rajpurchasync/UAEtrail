import type { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import {
  listPublicMemberPastActivities,
  listPublicMemberUpcomingActivities,
  loadPublicMemberBrief,
  loadPublicMemberProfilePage,
} from '../../services/member-public-read.js';
import {
  loadMemberProfileSocialGraph,
  parseMemberProfileSocialGraphParts,
} from '../../services/member-profile-social-graph.js';
import { parseMemberProfilePageIncludes } from '../../services/member-profile-includes.js';
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
      const includes = parseMemberProfilePageIncludes(req.query);
      const payload = await loadPublicMemberProfilePage({
        userId,
        viewerUserId: req.auth?.userId ?? null,
        isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
        fromDiscover,
        includes,
        upcomingLimit: Number(req.query.upcomingLimit),
        pastLimit: Number(req.query.pastLimit),
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

  router.get(
    '/member/:userId/past-activities',
    optionalAuth,
    validate({ params: userBriefParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
        const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
        const data = await listPublicMemberPastActivities({
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

  router.get(
    '/member/:userId/social-graph',
    optionalAuth,
    validate({ params: userBriefParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof userBriefParamSchema>;
        const parts = parseMemberProfileSocialGraphParts(req.query.parts);
        const data = await loadMemberProfileSocialGraph({
          targetUserId: userId,
          viewerUserId: req.auth?.userId ?? null,
          isPlatformAdmin: req.auth?.role === 'PLATFORM_ADMIN',
          parts,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
