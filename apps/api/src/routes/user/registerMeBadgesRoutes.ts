import type { Router } from 'express';
import { listMemberBadges } from '../../services/member-badges.js';

/** Authenticated member badges (`GET /me/badges`). */
export const registerMeBadgesRoutes = (router: Router): void => {
  router.get('/me/badges', async (req, res, next) => {
    try {
      const data = await listMemberBadges(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
