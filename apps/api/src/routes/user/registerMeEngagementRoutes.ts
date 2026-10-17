import type { Router } from 'express';
import { z } from 'zod';
import { registerActivityRoute } from '../../lib/activity-routes.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  joinMyActivityGroupChat,
  leaveMyActivityGroupChat,
  loadMyActivityGroupChatEntry,
  loadMyActivityGroupChatStatus,
} from '../../services/activity-group-chat-me-commands.js';
import {
  removeMyPushSubscription,
  upsertMyPushSubscription,
} from '../../services/me-account-session-commands.js';
import {
  listMyTenantMemberships,
  loadMyInbox,
  searchUsersForNewConversation,
} from '../../services/me-account-session-read.js';
import {
  listMyActivityJoinRequests,
  listMyParticipatingActivities,
  loadMyActivityJoinRequest,
} from '../../services/me-activity-participation-read.js';
import { eventIdParamSchema, pushSubscriptionSchema, userSearchSchema } from './schemas.js';

const meRequestIdParamSchema = z.object({ requestId: z.string().min(1) });

/** Authenticated activity participation hub (requires prior auth middleware). */
export const registerMeActivityParticipationRoutes = (router: Router): void => {
  registerActivityRoute(
    router,
    'get',
    '/:id/group-chat',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await loadMyActivityGroupChatEntry({ activityId: id, userId: req.auth!.userId });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'get',
    '/:id/group-chat/status',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await loadMyActivityGroupChatStatus({ activityId: id, userId: req.auth!.userId });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'post',
    '/:id/group-chat/join',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await joinMyActivityGroupChat({ activityId: id, userId: req.auth!.userId });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerActivityRoute(
    router,
    'delete',
    '/:id/group-chat',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        await leaveMyActivityGroupChat({ activityId: id, userId: req.auth!.userId });
        res.json({ data: { left: true } });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/requests/:requestId', validate({ params: meRequestIdParamSchema }), async (req, res, next) => {
    try {
      const { requestId } = req.params as z.infer<typeof meRequestIdParamSchema>;
      const data = await loadMyActivityJoinRequest(req.auth!.userId, requestId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/requests', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listMyActivityJoinRequests({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/activities', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listMyParticipatingActivities({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });
};

/** Push, host gate, tenant memberships, user search (requires prior auth middleware). */
export const registerMeAccountSessionRoutes = (router: Router): void => {
  router.post('/me/push-subscriptions', validate({ body: pushSubscriptionSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof pushSubscriptionSchema>;
      const sub = await upsertMyPushSubscription({
        userId: req.auth!.userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      });
      res.status(201).json({ data: { id: sub.id } });
    } catch (error) {
      next(error);
    }
  });

  router.delete(
    '/me/push-subscriptions',
    validate({ body: z.object({ endpoint: z.string().url() }) }),
    async (req, res, next) => {
      try {
        const { endpoint } = req.body as { endpoint: string };
        await removeMyPushSubscription({ userId: req.auth!.userId, endpoint });
        res.json({ message: 'Push subscription removed.' });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/me/tenants', async (req, res, next) => {
    try {
      const data = await listMyTenantMemberships(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/inbox', async (req, res, next) => {
    try {
      const data = await loadMyInbox(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/users/search', validate({ query: userSearchSchema }), async (req, res, next) => {
    try {
      const { q } = req.query as z.infer<typeof userSearchSchema>;
      const data = await searchUsersForNewConversation({
        viewerUserId: req.auth!.userId,
        query: q,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
