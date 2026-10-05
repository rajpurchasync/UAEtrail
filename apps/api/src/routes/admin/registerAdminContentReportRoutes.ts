import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';

const contentReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

/** Platform admin content reports (`GET /admin/reports`). */
export const registerAdminContentReportRoutes = (adminRouter: Router): void => {
  adminRouter.get('/reports', validate({ query: contentReportsQuerySchema }), async (req, res, next) => {
    try {
      const { page, pageSize } = req.query as unknown as z.infer<typeof contentReportsQuerySchema>;
      const { listContentReportsAdmin } = await import('../../lib/content-reports-store.js');
      const { items, total } = await listContentReportsAdmin({
        skip: (page - 1) * pageSize,
        take: pageSize,
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
