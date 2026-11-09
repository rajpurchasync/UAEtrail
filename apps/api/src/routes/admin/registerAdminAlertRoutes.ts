import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  createPlatformAlert,
  expirePlatformAlert,
  listPlatformAlertsAdmin,
  updatePlatformAlert,
} from '../../services/platform-alerts-admin.js';

const bodySchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(2000),
  severity: z.enum(['info', 'warning', 'critical']),
  scope: z.enum(['global', 'region', 'point']),
  region: z.string().max(120).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  linkUrl: z.string().url().max(2048).optional().nullable(),
  linkLabel: z.string().max(80).optional().nullable(),
  active: z.boolean().optional(),
});

const patchSchema = bodySchema.partial();

export const registerAdminAlertRoutes = (router: Router): void => {
  router.get('/alerts', async (_req, res, next) => {
    try {
      const rows = await listPlatformAlertsAdmin();
      res.json({ data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post('/alerts', validate({ body: bodySchema }), async (req, res, next) => {
    try {
      const data = await createPlatformAlert(req.body);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/alerts/:id',
    validate({ params: z.object({ id: z.string().min(1) }), body: patchSchema }),
    async (req, res, next) => {
      try {
        const data = await updatePlatformAlert(String(req.params.id), req.body);
        if (!data) {
          res.status(404).json({ error: 'Alert not found' });
          return;
        }
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/alerts/:id/expire',
    validate({ params: z.object({ id: z.string().min(1) }) }),
    async (req, res, next) => {
      try {
        const data = await expirePlatformAlert(String(req.params.id));
        if (!data) {
          res.status(404).json({ error: 'Alert not found' });
          return;
        }
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
