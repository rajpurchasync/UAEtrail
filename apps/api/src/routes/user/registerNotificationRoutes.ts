import { z } from 'zod';
import type { Router } from 'express';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { markAllMyNotificationsRead, markMyNotificationRead } from '../../services/me-notifications-commands.js';
import { listMyNotifications } from '../../services/me-notifications-read.js';
import { eventIdParamSchema } from './schemas.js';

export const registerNotificationRoutes = (router: Router): void => {
  router.get('/me/notifications', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items: notifications, total, unreadCount } = await listMyNotifications({
        userId: req.auth!.userId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });

      res.json({
        ...paginatedResponse(
          notifications.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            type: item.type.toLowerCase(),
            isRead: item.isRead,
            meta: item.meta,
            createdAt: item.createdAt,
          })),
          total,
          pg
        ),
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/me/notifications/:id/read', validate({ params: eventIdParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      await markMyNotificationRead({ id, userId: req.auth!.userId });
      res.json({ message: 'Notification marked as read.' });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/me/notifications/read-all', async (req, res, next) => {
    try {
      const count = await markAllMyNotificationsRead(req.auth!.userId);
      res.json({ message: 'All notifications marked as read.', count });
    } catch (error) {
      next(error);
    }
  });
};
