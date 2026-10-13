import type { RequestHandler, Router } from 'express';
import { z } from 'zod';
import { createParticipantIntentSchema, updateParticipantIntentSchema } from '../../domain/participant-intent.js';
import {
  cancelParticipantIntent,
  createParticipantIntent,
  findParticipantIntentById,
  linkParticipantIntentToActivityForOwner,
  listParticipantIntentsForUser,
  updateParticipantIntent,
} from '../../lib/participant-intents-store.js';
import {
  approveParticipantIntentJoinRequest,
  createParticipantIntentJoinRequest,
  findParticipantIntentJoinRequestForUser,
  listParticipantIntentJoinRequestsForOwner,
  rejectParticipantIntentJoinRequest,
} from '../../lib/participant-intent-requests-store.js';
import {
  notifyDemandJoinRequestDecided,
  notifyDemandJoinRequestSubmitted,
} from '../../services/participant-intent-join-notifications.js';
import { ApiError } from '../../lib/api-error.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const intentIdParamSchema = z.object({ intentId: z.string().min(1) });
const intentRequestParamsSchema = z.object({
  intentId: z.string().min(1),
  requestId: z.string().min(1),
});

/** Demand (participant intent) CRUD + join requests under `/me/participant-intents/*`. */
export const registerMeParticipantIntentRoutes = (router: Router): void => {
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
    validate({ params: intentIdParamSchema, body: updateParticipantIntentSchema }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
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
    validate({ params: intentIdParamSchema }),
    async (req, res, next) => {
      try {
        const { intentId } = req.params as z.infer<typeof intentIdParamSchema>;
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
        const data = await linkParticipantIntentToActivityForOwner(
          intentId,
          req.auth!.userId,
          activityId
        );
        if (!data) {
          throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
        }
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
      const data = await createParticipantIntentJoinRequest({
        intentId,
        userId: req.auth!.userId,
        note,
      });
      const intent = await findParticipantIntentById(intentId);
      if (intent) {
        void notifyDemandJoinRequestSubmitted({
          requesterUserId: req.auth!.userId,
          hostUserId: intent.userId,
          intentId: intent.id,
          intentTitle: intent.title,
          requestId: data.id,
          activityId: intent.activityId ?? intent.seekingActivityId,
        });
      }
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  const listJoinRequestsForOwner: RequestHandler = async (req, res, next) => {
    try {
      const { intentId } = req.params as { intentId: string };
      const data = await listParticipantIntentJoinRequestsForOwner(intentId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const getMyJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId } = req.params as { intentId: string };
      const data = await findParticipantIntentJoinRequestForUser(intentId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const approveJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId, requestId } = req.params as z.infer<typeof intentRequestParamsSchema>;
      const data = await approveParticipantIntentJoinRequest(intentId, requestId, req.auth!.userId);
      const intent = await findParticipantIntentById(intentId);
      if (intent) {
        void notifyDemandJoinRequestDecided({
          requesterUserId: data.userId,
          intentTitle: intent.title,
          intentId: intent.id,
          requestId: data.id,
          approved: true,
          activityId: intent.activityId ?? intent.seekingActivityId,
        });
      }
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const rejectJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const { intentId, requestId } = req.params as z.infer<typeof intentRequestParamsSchema>;
      const data = await rejectParticipantIntentJoinRequest(intentId, requestId, req.auth!.userId);
      const intent = await findParticipantIntentById(intentId);
      if (intent) {
        void notifyDemandJoinRequestDecided({
          requesterUserId: data.userId,
          intentTitle: intent.title,
          intentId: intent.id,
          requestId: data.id,
          approved: false,
          activityId: intent.activityId ?? intent.seekingActivityId,
        });
      }
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
