import type { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { resolveMemberHostStatus } from '../../services/member-host-status.js';

/** Member host tiers + publish gates (`GET /me/host-status`). */
export const registerMemberHostStatusRoutes = (router: Router): void => {
  router.get('/me/host-status', requireAuth, async (req, res, next) => {
    try {
      const data = await resolveMemberHostStatus(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
