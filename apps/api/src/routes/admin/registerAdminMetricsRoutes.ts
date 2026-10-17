import { Router } from 'express';
import { loadAdminDashboardMetrics } from '../../services/admin-metrics-read.js';

/** Platform admin dashboard aggregate metrics (`GET /admin/metrics`). */
export const registerAdminMetricsRoutes = (adminRouter: Router): void => {
  adminRouter.get('/metrics', async (_req, res, next) => {
    try {
      const data = await loadAdminDashboardMetrics();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
