import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { confirmAmenityReport, listPendingAmenityReports } from '../../services/amenity-reports.js';

export const registerAdminAmenityReportRoutes = (router: Router): void => {
  router.get('/amenity-reports', async (_req, res, next) => {
    try {
      const rows = await listPendingAmenityReports();
      res.json({
        data: rows.map((r) => ({
          id: r._id,
          facilityId: r.facilityId,
          amenityState: r.amenityState,
          note: r.note,
          submittedBy: r.submittedBy,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/amenity-reports/:id/confirm',
    validate({ params: z.object({ id: z.string().min(1) }) }),
    async (req, res, next) => {
      try {
        const data = await confirmAmenityReport(String(req.params.id), req.auth!.userId);
        if (!data) {
          res.status(404).json({ error: 'Report not found' });
          return;
        }
        res.json({ data: { id: data._id, status: data.status } });
      } catch (error) {
        next(error);
      }
    }
  );
};
