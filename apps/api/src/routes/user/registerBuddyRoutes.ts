import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { acceptBuddyRequest, cancelBuddyRequest, createBuddyRequest, declineBuddyRequest, getBuddyRelationship, listBuddyRequestsForUser, listBuddiesForUser, unfriendBuddy } from '../../lib/buddy-store.js';
import { notifyBuddyRequestAccepted, notifyBuddyRequestReceived } from '../../services/buddy-notifications.js';
import { buddyRelationshipParamSchema, buddyRequestIdParamSchema, createBuddyRequestSchema, listBuddyRequestsQuerySchema } from './schemas.js';
import type { Router } from 'express';

export const registerBuddyRoutes = (router: Router): void => {
router.get('/me/buddies', async (req, res, next) => {
  try {
    const data = await listBuddiesForUser(req.auth!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/me/buddies/:userId/unfriend',
  validate({ params: buddyRelationshipParamSchema }),
  async (req, res, next) => {
    try {
      const { userId } = req.params as z.infer<typeof buddyRelationshipParamSchema>;
      await unfriendBuddy(req.auth!.userId, userId);
      res.json({ data: { unfriended: true } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me/buddy-requests', validate({ query: listBuddyRequestsQuerySchema }), async (req, res, next) => {
  try {
    const { direction = 'all' } = req.query as z.infer<typeof listBuddyRequestsQuerySchema>;
    const data = await listBuddyRequestsForUser(req.auth!.userId, direction);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/me/buddy-requests', validate({ body: createBuddyRequestSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createBuddyRequestSchema>;
    const request = await createBuddyRequest({
      fromUserId: req.auth!.userId,
      toUserId: body.targetUserId,
      message: body.message,
    });

    if (request.status === 'pending') {
      await notifyBuddyRequestReceived({
        requestId: request.id,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
      });
    } else if (request.status === 'accepted') {
      await notifyBuddyRequestAccepted({
        requestId: request.id,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
      });
    }

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
      const request = await acceptBuddyRequest(requestId, req.auth!.userId);
      await notifyBuddyRequestAccepted({
        requestId: request.id,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
      });
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
      const request = await declineBuddyRequest(requestId, req.auth!.userId);
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
      const request = await cancelBuddyRequest(requestId, req.auth!.userId);
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
      const data = await getBuddyRelationship(req.auth!.userId, userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);
};
