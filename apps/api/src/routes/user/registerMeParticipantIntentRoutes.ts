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

type SeekingPostRouteMount = {
  basePath: string;
  /** Route param — correlation id stored as `participantIntentId` on the seeking activity. */
  idParam: 'postId';
};

const resolvePostId = (params: Record<string, string>, idParam: SeekingPostRouteMount['idParam']): string =>
  params[idParam];

const mountSeekingPostRoutes = (router: Router, mount: SeekingPostRouteMount): void => {
  const { basePath, idParam } = mount;
  const idParamSchema = z.object({ [idParam]: z.string().min(1) });
  const requestParamsSchema = z.object({
    [idParam]: z.string().min(1),
    requestId: z.string().min(1),
  });

  router.get(basePath, requireAuth, async (req, res, next) => {
    try {
      const data = await listMyParticipantIntents(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    basePath,
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
    `${basePath}/:${idParam}`,
    requireAuth,
    validate({ params: idParamSchema, body: updateParticipantIntentSchema }),
    async (req, res, next) => {
      try {
        const postId = resolvePostId(req.params as Record<string, string>, idParam);
        const data = await updateMyParticipantIntent(req.auth!.userId, postId, req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    `${basePath}/:${idParam}/cancel`,
    requireAuth,
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const postId = resolvePostId(req.params as Record<string, string>, idParam);
        const data = await cancelMyParticipantIntent(req.auth!.userId, postId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    `${basePath}/:${idParam}/link-activity`,
    requireAuth,
    validate({
      params: idParamSchema,
      body: z.object({ activityId: z.string().min(1) }),
    }),
    async (req, res, next) => {
      try {
        const postId = resolvePostId(req.params as Record<string, string>, idParam);
        const { activityId } = req.body as { activityId: string };
        const data = await linkMyParticipantIntentToActivity(req.auth!.userId, postId, activityId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  const createJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const postId = resolvePostId(req.params as Record<string, string>, idParam);
      const { note } = (req.body ?? {}) as { note?: string };
      const data = await submitMyParticipantIntentJoinRequest({
        intentId: postId,
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
      const postId = resolvePostId(req.params as Record<string, string>, idParam);
      const data = await listMyParticipantIntentJoinRequestsForOwner(postId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const getMyJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const postId = resolvePostId(req.params as Record<string, string>, idParam);
      const data = await findMyParticipantIntentJoinRequest(postId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const approveJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const params = req.params as z.infer<typeof requestParamsSchema>;
      const postId = params[idParam];
      const { requestId } = params;
      const data = await approveMyParticipantIntentJoinRequest(postId, requestId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const rejectJoinRequest: RequestHandler = async (req, res, next) => {
    try {
      const params = req.params as z.infer<typeof requestParamsSchema>;
      const postId = params[idParam];
      const { requestId } = params;
      const data = await rejectMyParticipantIntentJoinRequest(postId, requestId, req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  const mountJoinRequestRoutes = (requestSegment: 'requests' | 'join-requests') => {
    router.post(
      `${basePath}/:${idParam}/${requestSegment}`,
      requireAuth,
      validate({
        params: idParamSchema,
        body: z.object({ note: z.string().max(500).optional() }),
      }),
      createJoinRequest
    );
    router.get(
      `${basePath}/:${idParam}/${requestSegment}`,
      requireAuth,
      validate({ params: idParamSchema }),
      listJoinRequestsForOwner
    );
    router.get(
      `${basePath}/:${idParam}/${requestSegment}/mine`,
      requireAuth,
      validate({ params: idParamSchema }),
      getMyJoinRequest
    );
    router.post(
      `${basePath}/:${idParam}/${requestSegment}/:requestId/approve`,
      requireAuth,
      validate({ params: requestParamsSchema }),
      approveJoinRequest
    );
    router.post(
      `${basePath}/:${idParam}/${requestSegment}/:requestId/reject`,
      requireAuth,
      validate({ params: requestParamsSchema }),
      rejectJoinRequest
    );
  };

  mountJoinRequestRoutes('requests');
};

/** Activity-backed seeking posts (`activityMode: seeking`) — BWL `/me/seeking-posts/*`. */
export const registerMeSeekingPostRoutes = (router: Router): void => {
  mountSeekingPostRoutes(router, { basePath: '/me/seeking-posts', idParam: 'postId' });
};

/** @deprecated Use {@link registerMeSeekingPostRoutes} (MIG-COH-01). */
export const registerMeParticipantIntentRoutes = registerMeSeekingPostRoutes;
