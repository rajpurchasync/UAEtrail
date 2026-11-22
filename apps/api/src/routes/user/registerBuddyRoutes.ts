import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  acceptBuddyRequestForUser,
  cancelBuddyRequestForUser,
  declineBuddyRequestForUser,
  submitBuddyRequest,
  unfriendBuddyForUser,
} from '../../services/buddy-me-commands.js';
import {
  listMyBuddyRequests,
  listMyBuddies,
  loadMyBuddyRelationship,
  loadMyBuddiesActivityPresence,
} from '../../services/buddy-me-read.js';
import {
  buddyRelationshipParamSchema,
  buddyRequestIdParamSchema,
  createBuddyRequestSchema,
  listBuddyRequestsQuerySchema,
} from './schemas.js';
import type { Router } from 'express';

const buddyActivityPresenceQuerySchema = z.object({
  date: z.string().trim().max(32).optional(),
});

const registerListMyBuddiesRoute = (router: Router, path: '/me/buddies' | '/me/friends') => {
  router.get(path, async (req, res, next) => {
    try {
      const data = await listMyBuddies(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};

export const registerBuddyRoutes = (router: Router): void => {
  registerListMyBuddiesRoute(router, '/me/buddies');
  /** Product label Friends — read alias of `GET /me/buddies` (P7 wire cleanup). */
  registerListMyBuddiesRoute(router, '/me/friends');

  router.get(
    '/me/buddies/activity-presence',
    validate({ query: buddyActivityPresenceQuerySchema }),
    async (req, res, next) => {
      try {
        const query = buddyActivityPresenceQuerySchema.parse(req.query);
        const data = await loadMyBuddiesActivityPresence({
          viewerUserId: req.auth!.userId,
          userRole: req.auth!.role,
          datePresetRaw: query.date,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/buddies/:userId/unfriend',
    validate({ params: buddyRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
        const data = await unfriendBuddyForUser(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/buddy-requests', validate({ query: listBuddyRequestsQuerySchema }), async (req, res, next) => {
    try {
      const { direction = 'all' } = req.query as z.infer<typeof listBuddyRequestsQuerySchema>;
      const data = await listMyBuddyRequests(req.auth!.userId, direction);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/buddy-requests', validate({ body: createBuddyRequestSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createBuddyRequestSchema>;
      const request = await submitBuddyRequest({
        fromUserId: req.auth!.userId,
        toUserId: body.targetUserId,
        message: body.message,
      });
      res.status(request.status === 'accepted' ? 200 : 201).json({ data: request });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/me/buddy-requests/:requestId/accept',
    validate({ params: buddyRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof buddyRequestIdParamSchema>;
        const request = await acceptBuddyRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/buddy-requests/:requestId/decline',
    validate({ params: buddyRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof buddyRequestIdParamSchema>;
        const request = await declineBuddyRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/buddy-requests/:requestId/cancel',
    validate({ params: buddyRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof buddyRequestIdParamSchema>;
        const request = await cancelBuddyRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/buddy-relationship/:userId',
    validate({ params: buddyRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
        const data = await loadMyBuddyRelationship(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
