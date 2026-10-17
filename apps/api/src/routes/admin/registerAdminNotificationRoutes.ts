import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { broadcastAdminNotification } from '../../services/admin-notification-commands.js';
import { listAdminBroadcastNotifications } from '../../services/admin-notification-read.js';

const sendNotificationSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(1000),
  targetRole: z.string().optional(),
});

/** Platform admin broadcast notifications (`/admin/notifications`). */
export const registerAdminNotificationRoutes = (adminRouter: Router): void => {
  adminRouter.post('/notifications', validate({ body: sendNotificationSchema }), async (req, res, next) => {
    try {
      const { title, body, targetRole } = req.body as z.infer<typeof sendNotificationSchema>;
      const { count } = await broadcastAdminNotification({
        actorId: req.auth!.userId,
        title,
        body,
        targetRole,
      });
      res.status(201).json({ data: { count } });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/notifications', async (_req, res, next) => {
    try {
      const data = await listAdminBroadcastNotifications(20);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
