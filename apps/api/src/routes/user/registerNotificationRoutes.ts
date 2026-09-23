import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { listUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../lib/notifications-store.js';
import { eventIdParamSchema } from './schemas.js';
import type { Router } from 'express';

export const registerNotificationRoutes = (router: Router): void => {
router.get('/me/notifications', async (req, res, next) => {
  try {
    const pg = paginationSchema.parse(req.query);
    const { items: notifications, total, unreadCount } = await listUserNotifications({
      userId: req.auth!.userId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
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
          createdAt: item.createdAt
        })),
        total,
        pg
      ),
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/notifications/:id/read', validate({ params: eventIdParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    await markNotificationAsRead({ id, userId: req.auth!.userId });
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/notifications/read-all', async (req, res, next) => {
  try {
    const count = await markAllNotificationsAsRead(req.auth!.userId);
    res.json({ message: 'All notifications marked as read.', count });
  } catch (error) {
    next(error);
  }
});
};
