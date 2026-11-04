import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { listAdminContentReports } from '../../services/admin-content-reports-read.js';

const contentReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  reason: z.enum(['spam', 'harassment', 'other']).optional(),
  targetType: z.enum(['user', 'message', 'post', 'review', 'reply']).optional(),
  reporter: z.string().trim().max(120).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Platform admin content reports (`GET /admin/reports`). */
export const registerAdminContentReportRoutes = (adminRouter: Router): void => {
  adminRouter.get('/reports', validate({ query: contentReportsQuerySchema }), async (req, res, next) => {
    try {
      const { page, pageSize, reason, targetType, reporter, from, to } = req.query as unknown as z.infer<
        typeof contentReportsQuerySchema
      >;
      const { items, total } = await listAdminContentReports({
        page,
        pageSize,
        reason,
        targetType,
        reporter,
        from,
        to,
      });
      res.json({
        data: items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  });
};
