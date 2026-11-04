import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { listAdminAuditLogs } from '../../services/admin-audit-read.js';

const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  actor: z.string().trim().max(120).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/** Platform admin audit log browse (`GET /admin/audit-logs`). */
export const registerAdminAuditRoutes = (adminRouter: Router): void => {
  adminRouter.get('/audit-logs', validate({ query: auditLogQuerySchema }), async (req, res, next) => {
    try {
      const { action, entityType, actor, from, to, page, pageSize } = req.query as unknown as z.infer<
        typeof auditLogQuerySchema
      >;
      const { items, total } = await listAdminAuditLogs({
        action,
        entityType,
        actor,
        from,
        to,
        page,
        pageSize,
      });
      res.json({
        data: items,
        pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  });
};
