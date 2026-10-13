import type { Router } from 'express';
import { buildMemberStatusDto } from '@uaetrail/shared-types';
import { requireAuth } from '../../middleware/auth.js';
import { resolveMemberStatus } from '../../services/member-status.js';

/** Member capabilities — single wire route `GET /me/status` (legacy paths rewritten in middleware). */
export const registerMemberStatusRoutes = (router: Router): void => {
  router.get('/me/status', requireAuth, async (req, res, next) => {
    try {
      const data = await resolveMemberStatus(req.auth!.userId);
      res.json({ data: buildMemberStatusDto(data) });
    } catch (error) {
      next(error);
    }
  });
};
