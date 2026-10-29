import type { Router } from 'express';
import type { z } from 'zod';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { respondToActivityGuideInvite } from '../../services/activity-guides.js';
import { eventIdParamSchema } from './schemas.js';

/** Community guide invite accept/decline on the activity. */
export const registerActivityGuideRoutes = (router: Router): void => {
  registerActivityRoute(
    router,
    'post',
    '/:id/guides/accept',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await respondToActivityGuideInvite({
          activityId: id,
          userId: req.auth!.userId,
          accept: true,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'post',
    '/:id/guides/decline',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await respondToActivityGuideInvite({
          activityId: id,
          userId: req.auth!.userId,
          accept: false,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
