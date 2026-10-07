import { UserRole } from '../../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { listBroadcastNotificationAuditLogs } from '../../lib/admin-store.js';
import { validate } from '../../middleware/validate.js';
import { listAuthUsers } from '../../lib/auth-users.js';
import { createNotificationsMany } from '../../lib/notifications-store.js';

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

      const users = await listAuthUsers({
        status: 'ACTIVE',
        role: targetRole ? (targetRole.toUpperCase() as UserRole) : undefined,
        take: 10000,
      });

      if (users.length === 0) {
        throw new ApiError(400, 'no_recipients', 'No users match the target criteria.');
      }

      await createNotificationsMany(
        users.map((u) => ({
          userId: u._id,
          title,
          body,
          type: 'SYSTEM' as const,
        }))
      );

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'notification.broadcast',
        entityType: 'notification',
        entityId: 'system',
        metadata: { recipientCount: users.length, targetRole: targetRole ?? 'all' },
      });

      res.status(201).json({ data: { count: users.length } });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.get('/notifications', async (_req, res, next) => {
    try {
      const logs = await listBroadcastNotificationAuditLogs(20);

      res.json({
        data: logs.map((l) => {
          const meta = l.metadata as Record<string, unknown> | null;
          return {
            id: l.id,
            title: 'System Notification',
            body: `Sent by ${l.actor.profile?.displayName ?? l.actor.email}`,
            targetRole: (meta?.targetRole as string) ?? null,
            recipientCount: (meta?.recipientCount as number) ?? 0,
            createdAt: l.createdAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });
};
