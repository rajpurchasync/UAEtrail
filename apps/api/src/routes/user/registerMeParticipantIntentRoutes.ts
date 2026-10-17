import type { RequestHandler, Router } from 'express';
import { z } from 'zod';
import { createParticipantIntentSchema, updateParticipantIntentSchema } from '../../domain/participant-intent.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  approveMyParticipantIntentJoinRequest,
  cancelMyParticipantIntent,
  createMyParticipantIntent,
  linkMyParticipantIntentToActivity,
  rejectMyParticipantIntentJoinRequest,
  submitMyParticipantIntentJoinRequest,
  updateMyParticipantIntent,
} from '../../services/participant-intent-me-commands.js';
import {
  findMyParticipantIntentJoinRequest,
  listMyParticipantIntentJoinRequestsForOwner,
  listMyParticipantIntents,
} from '../../services/participant-intent-me-read.js';

const intentIdParamSchema = z.object({ intentId: z.string().min(1) });
const intentRequestParamsSchema = z.object({
  intentId: z.string().min(1),
  requestId: z.string().min(1),
});

/** Demand (participant intent) CRUD + join requests under `/me/participant-intents/*`. */
export const registerMeParticipantIntentRoutes = (router: Router): void => {
  router.get('/me/participant-intents', requireAuth, async (req, res, next) => {
    try {
      const data = await listMyParticipantIntents(req.auth!.userId);
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
        const data = await createMyParticipantIntent(req.auth!.userId, req.body);
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    '/me/participant-intents/:intentId',
    requireAuth,
    validate({ params: intentIdParamSchema, body: updateParticipantIntentSchema }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
        const data = await updateMyParticipantIntent(req.auth!.userId, intentId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/participant-intents/:intentId/cancel',
    requireAuth,
    validate({ params: intentIdParamSchema }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
        const data = await cancelMyParticipantIntent(req.auth!.userId, intentId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/participant-intents/:intentId/link-activity',
    requireAuth,
    validate({
      params: intentIdParamSchema,
      body: z.object({ activityId: z.string().min(1) }),
    }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
        const { activityId } = req.body as { activityId: string };
        const data = await linkMyParticipantIntentToActivity(req.auth!.userId, intentId, activityId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  const createJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId } = req.params as { intentId: string };
      const { note } = (req.body ?? {}) as { note?: string };
      const data = await submitMyParticipantIntentJoinRequest({
        intentId,
        userId: req.auth!.userId,
        note,
      });
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  const listJoinRequestsForOwner: RequestHandler = async (req, res, next) => {
    try {
      const { intentId } = req.params as { intentId: string };
      const data = await listMyParticipantIntentJoinRequestsForOwner(intentId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const getMyJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId } = req.params as { intentId: string };
      const data = await findMyParticipantIntentJoinRequest(intentId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const approveJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId, requestId } = req.params as z.infer<typeof intentRequestParamsSchema>;
      const data = await approveMyParticipantIntentJoinRequest(intentId, requestId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const rejectJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId, requestId } = req.params as z.infer<typeof intentRequestParamsSchema>;
      const data = await rejectMyParticipantIntentJoinRequest(intentId, requestId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const mountJoinRequestRoutes = (requestSegment: 'requests' | 'join-requests') => {
    router.post(
      `/me/participant-intents/:intentId/${requestSegment}`,
      requireAuth,
      validate({
        params: intentIdParamSchema,
        body: z.object({ note: z.string().max(500).optional() }),
      }),
      createJoinRequest
    );
    router.get(
      `/me/participant-intents/:intentId/${requestSegment}`,
      requireAuth,
      validate({ params: intentIdParamSchema }),
      listJoinRequestsForOwner
    );
    router.get(
      `/me/participant-intents/:intentId/${requestSegment}/mine`,
      requireAuth,
      validate({ params: intentIdParamSchema }),
      getMyJoinRequest
    );
    router.post(
      `/me/participant-intents/:intentId/${requestSegment}/:requestId/approve`,
      requireAuth,
      validate({ params: intentRequestParamsSchema }),
      approveJoinRequest
    );
    router.post(
      `/me/participant-intents/:intentId/${requestSegment}/:requestId/reject`,
      requireAuth,
      validate({ params: intentRequestParamsSchema }),
      rejectJoinRequest
    );
  };

  mountJoinRequestRoutes('requests');
  /** @deprecated Prefer `…/requests` — mirrors `/activities/:id/requests`. */
  mountJoinRequestRoutes('join-requests');
};
