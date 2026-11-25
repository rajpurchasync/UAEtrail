import { Router } from 'express';
import { z } from 'zod';
import { mediaUrlSchema } from '../../domain/location-submit.js';
import { validate } from '../../middleware/validate.js';
import {
  createAdminDestinationRecord,
  deleteAdminDestinationRecord,
  updateAdminDestinationRecord,
} from '../../services/admin-destination-commands.js';
import { listAdminDestinationsForConsole } from '../../services/admin-destination-read.js';

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

const destinationBodySchema = z.object({
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

const destinationPatchSchema = destinationBodySchema.partial();

const idParamSchema = z.object({ id: z.string().min(1) });

/** Platform admin destinations CRUD (`/admin/destinations`). */
export const registerAdminDestinationRoutes = (adminRouter: Router): void => {
  adminRouter.get('/destinations', async (_req, res, next) => {
    try {
      const rows = await listAdminDestinationsForConsole();
      res.json({ data: rows });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post(
    '/destinations',
    validate({ body: destinationBodySchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof destinationBodySchema>;
        const created = await createAdminDestinationRecord(body);
        res.status(201).json({ data: created });
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.patch(
    '/destinations/:id',
    validate({ params: idParamSchema, body: destinationPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof destinationPatchSchema>;
        const updated = await updateAdminDestinationRecord(id, body);
        res.json({ data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.delete(
    '/destinations/:id',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteAdminDestinationRecord(id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};