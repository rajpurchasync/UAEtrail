import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../lib/api-error.js';
import {
  createAdminArea,
  deleteAdminArea,
  listAdminAreas,
  updateAdminArea,
} from '../../lib/areas-store.js';
import { invalidatePublishedAreasCache } from '../../lib/area-resolution.js';
import { boundsRingFromCenter } from '../../lib/area-bounds.js';
import { invalidateExploreMapCache } from '../../lib/explore-map-cache.js';

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
  imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

const areaPatchSchema = areaBodySchema.partial();

const idParamSchema = z.object({ id: z.string().min(1) });

/** Platform admin curated areas CRUD. */
export const registerAdminAreaRoutes = (adminRouter: Router): void => {
  adminRouter.get('/areas', async (_req, res, next) => {
    try {
      const areas = await listAdminAreas();
      res.json({ data: areas });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/areas', validate({ body: areaBodySchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof areaBodySchema>;
      const bounds = body.bounds ?? boundsRingFromCenter(body.center);
      const created = await createAdminArea({ ...body, bounds });
      invalidatePublishedAreasCache();
      await invalidateExploreMapCache();
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
        const patch =
          body.center && !body.bounds
            ? { ...body, bounds: boundsRingFromCenter(body.center) }
            : body;
        const updated = await updateAdminArea(id, patch);
        if (!updated) {
          throw new ApiError(404, 'area_not_found', 'Area not found.');
        }
        invalidatePublishedAreasCache();
        await invalidateExploreMapCache();
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
        const deleted = await deleteAdminArea(id);
        if (!deleted) {
          throw new ApiError(404, 'area_not_found', 'Area not found.');
        }
        invalidatePublishedAreasCache();
        await invalidateExploreMapCache();
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};
