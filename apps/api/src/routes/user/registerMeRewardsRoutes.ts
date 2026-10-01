import type { Router } from 'express';
import { createParticipantIntentSchema, updateParticipantIntentSchema } from '../../domain/participant-intent.js';
import {
  cancelParticipantIntent,
  createParticipantIntent,
  listParticipantIntentsForUser,
  updateParticipantIntent,
} from '../../lib/participant-intents-store.js';
import { ApiError } from '../../lib/api-error.js';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getRewardSummary } from '../../services/rewards.js';

/** Authenticated rewards + explore demand intents. Requires prior auth middleware. */
export const registerMeRewardsRoutes = (router: Router): void => {
  router.get('/me/participant-intents', requireAuth, async (req, res, next) => {
    try {
      const data = await listParticipantIntentsForUser(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

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

  router.patch(
    '/me/participant-intents/:intentId',
    requireAuth,
    validate({
      params: z.object({ intentId: z.string().min(1) }),
      body: updateParticipantIntentSchema,
    }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as { intentId: string };
        const data = await updateParticipantIntent(req.auth!.userId, intentId, req.body);
        if (!data) {
          throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
        }
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/participant-intents/:intentId/cancel',
    requireAuth,
    validate({ params: z.object({ intentId: z.string().min(1) }) }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as { intentId: string };
        const data = await cancelParticipantIntent(req.auth!.userId, intentId);
        if (!data) {
          throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
        }
        res.json({ data });
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
