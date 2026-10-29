import { Router } from 'express';
import { z } from 'zod';
import { mediaUrlSchema } from '../../domain/location-submit.js';
import { validate } from '../../middleware/validate.js';
import {
  createAdminAreaRecord,
  deleteAdminAreaRecord,
  updateAdminAreaRecord,
} from '../../services/admin-area-commands.js';
import { listAdminAreasForConsole } from '../../services/admin-area-read.js';

const centerSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const boundsSchema = z
  .array(
    z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
  )
  .min(3);

const areaBodySchema = z.object({
  slug: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  region: z.string().min(2).max(80),
  status: z.enum(['draft', 'published']),
  center: centerSchema,
  bounds: boundsSchema.optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  summary: z.string().max(2000).optional().nullable(),
  countryCode: z.string().min(2).max(8).optional(),
  imageUrl: z.union([mediaUrlSchema, z.literal(''), z.null()]).optional(),
});

const areaPatchSchema = areaBodySchema.partial();

const idParamSchema = z.object({ id: z.string().min(1) });

/** Platform admin curated areas CRUD. */
export const registerAdminAreaRoutes = (adminRouter: Router): void => {
  adminRouter.get('/areas', async (_req, res, next) => {
    try {
      const areas = await listAdminAreasForConsole();
      res.json({ data: areas });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/areas', validate({ body: areaBodySchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof areaBodySchema>;
      const created = await createAdminAreaRecord(body);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/areas/:id',
    validate({ params: idParamSchema, body: areaPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof areaPatchSchema>;
        const updated = await updateAdminAreaRecord(id, body);
        res.json({ data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.delete(
    '/areas/:id',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteAdminAreaRecord(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};
