import { Router } from 'express';
import { z } from 'zod';
import { listAuditLogsPaged } from '../../lib/admin-store.js';
import { validate } from '../../middleware/validate.js';

const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/** Platform admin audit log browse (`GET /admin/audit-logs`). */
export const registerAdminAuditRoutes = (adminRouter: Router): void => {
  adminRouter.get('/audit-logs', validate({ query: auditLogQuerySchema }), async (req, res, next) => {
    try {
      const { action, entityType, page, pageSize } = req.query as unknown as z.infer<typeof auditLogQuerySchema>;

      const where: { action?: string | { contains: string }; entityType?: string } = {};
      if (action) where.action = { contains: action };
      if (entityType) where.entityType = entityType;

      const { items: logs, total } = await listAuditLogsPaged({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      res.json({
        data: logs.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          actorEmail: l.actor.email,
          actorName: l.actor.profile?.displayName ?? null,
          tenantId: l.tenantId,
          metadata: l.metadata,
          createdAt: l.createdAt,
        })),
        pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  });
};
