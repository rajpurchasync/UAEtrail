import type { Router } from 'express';
import { createParticipantIntentSchema } from '../../domain/participant-intent.js';
import { createParticipantIntent } from '../../lib/participant-intents-store.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getRewardSummary } from '../../services/rewards.js';

/** Authenticated rewards + explore demand intents. Requires prior auth middleware. */
export const registerMeRewardsRoutes = (router: Router): void => {
  router.post(
    '/me/participant-intents',
    requireAuth,
    validate({ body: createParticipantIntentSchema }),
    async (req, res, next) => {
      try {
        const data = await createParticipantIntent(req.auth!.userId, req.body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/rewards', async (req, res, next) => {
    try {
      const data = await getRewardSummary(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
