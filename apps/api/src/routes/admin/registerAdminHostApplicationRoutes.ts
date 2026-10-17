import { Router } from 'express';
import { z } from 'zod';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { reviewAdminHostApplication } from '../../services/admin-host-application-commands.js';
import { listAdminHostApplicationsPage } from '../../services/admin-host-application-read.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const applicationPatchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewerNote: z.string().max(300).optional(),
});

/** Platform admin review of Pro / host / shop applications. */
export const registerAdminHostApplicationRoutes = (router: Router): void => {
  router.get('/host-applications', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listAdminHostApplicationsPage({
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/host-applications/:id',
    validate({ params: idParamSchema, body: applicationPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const { status, reviewerNote } = req.body as z.infer<typeof applicationPatchSchema>;
        const result = await reviewAdminHostApplication({
          applicationId: id,
          reviewerId: req.auth!.userId,
          status,
          reviewerNote,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );
};
