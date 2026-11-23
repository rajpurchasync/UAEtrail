import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  acceptFriendRequestForUser,
  cancelFriendRequestForUser,
  declineFriendRequestForUser,
  submitFriendRequest,
  unfriendMemberForUser,
} from '../../services/friend-me-commands.js';
import {
  listMyFriendRequests,
  listMyFriends,
  loadMyFriendRelationship,
  loadMyFriendsActivityPresence,
} from '../../services/friend-me-read.js';
import {
  friendRelationshipParamSchema,
  friendRequestIdParamSchema,
  createFriendRequestSchema,
  listFriendRequestsQuerySchema,
} from './schemas.js';
import type { Router } from 'express';

const friendActivityPresenceQuerySchema = z.object({
  date: z.string().trim().max(32).optional(),
});

export const registerFriendRoutes = (router: Router): void => {
  router.get('/me/friends', async (req, res, next) => {
    try {
      const data = await listMyFriends(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/me/friends/activity-presence',
    validate({ query: friendActivityPresenceQuerySchema }),
    async (req, res, next) => {
      try {
        const query = friendActivityPresenceQuerySchema.parse(req.query);
        const data = await loadMyFriendsActivityPresence({
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
    '/me/friends/:userId/unfriend',
    validate({ params: friendRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof friendRelationshipParamSchema>;
        const data = await unfriendMemberForUser(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/friend-requests', validate({ query: listFriendRequestsQuerySchema }), async (req, res, next) => {
    try {
      const { direction = 'all' } = req.query as z.infer<typeof listFriendRequestsQuerySchema>;
      const data = await listMyFriendRequests(req.auth!.userId, direction);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/friend-requests', validate({ body: createFriendRequestSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createFriendRequestSchema>;
      const request = await submitFriendRequest({
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
    '/me/friend-requests/:requestId/accept',
    validate({ params: friendRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof friendRequestIdParamSchema>;
        const request = await acceptFriendRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/friend-requests/:requestId/decline',
    validate({ params: friendRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof friendRequestIdParamSchema>;
        const request = await declineFriendRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/me/friend-requests/:requestId/cancel',
    validate({ params: friendRequestIdParamSchema }),
    async (req, res, next) => {
      try {
        const { requestId } = req.params as z.infer<typeof friendRequestIdParamSchema>;
        const request = await cancelFriendRequestForUser(requestId, req.auth!.userId);
        res.json({ data: request });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/me/friend-relationship/:userId',
    validate({ params: friendRelationshipParamSchema }),
    async (req, res, next) => {
      try {
        const { userId } = req.params as z.infer<typeof friendRelationshipParamSchema>;
        const data = await loadMyFriendRelationship(req.auth!.userId, userId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
