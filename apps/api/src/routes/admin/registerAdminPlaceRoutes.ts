import { Router } from 'express';
import { z } from 'zod';
import { mediaUrlSchema } from '../../domain/location-submit.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  createAdminPlaceRecord,
  deleteAdminPlaceRecord,
  updateAdminPlaceRecord,
} from '../../services/admin-place-commands.js';
import { listAdminPlacesPage } from '../../services/admin-place-read.js';

const locationFieldsSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  areaLabel: z.string().min(2).max(120).optional().nullable(),
  areaId: z.string().min(1).max(80).optional().nullable(),
  activityType: z.enum(['hiking', 'camping', 'event', 'shop']),
  description: z.string().min(20),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  season: z.array(z.string()).min(1),
  childFriendly: z.boolean().default(false),
  maxGroupSize: z.number().int().positive().optional(),
  accessibility: z.enum(['car-accessible', 'remote']).optional(),
  images: z.array(mediaUrlSchema).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'inactive']).default('active'),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  elevation: z.number().int().nonnegative().optional(),
  campingType: z.enum(['self-guided', 'operator-led']).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  highlights: z.array(z.string()).default([]),
  surfaceType: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  parkingLink: z.string().max(500).optional().nullable(),
  parkingLat: z.number().min(-90).max(90).optional().nullable(),
  parkingLng: z.number().min(-180).max(180).optional().nullable(),
  accessibleBy: z.array(z.string()).default([]),
  countryCode: z.string().length(2).optional(),
  gpxKey: z.string().max(500).optional().nullable(),
  guidePdfKey: z.string().max(500).optional().nullable(),
  guideMarkdown: z.string().max(50000).optional().nullable(),
  guidePreview: z.string().max(2000).optional().nullable(),
  unlockPriceAed: z.number().int().min(0).max(9999).optional(),
});

const requireActiveCatalogImagesOnCreate = (
  data: { status?: 'draft' | 'active' | 'inactive'; images: string[] },
  ctx: z.RefinementCtx
) => {
  const status = data.status ?? 'active';
  if (status === 'active' && data.images.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Active catalog places must include at least one image URL',
      path: ['images'],
    });
  }
};

const locationCreateSchema = locationFieldsSchema.superRefine(requireActiveCatalogImagesOnCreate);

const locationPatchSchema = locationFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.status === 'active' && data.images !== undefined && data.images.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Active catalog places must include at least one image URL',
      path: ['images'],
    });
  }
});

const idParamSchema = z.object({ id: z.string().min(1) });

const adminPlaceCollectionPaths = ['/places'] as const;
const adminPlaceItemPaths = ['/places/:id'] as const;

/** Platform admin place CRUD (`/admin/places`; SPA redirects legacy `/admin/locations`). */
export const registerAdminPlaceRoutes = (adminRouter: Router): void => {
  adminPlaceCollectionPaths.forEach((path) => {
    adminRouter.get(path, validate({ query: paginationSchema }), async (req, res, next) => {
      try {
        const pg = req.query as unknown as z.infer<typeof paginationSchema>;
        const { items, total } = await listAdminPlacesPage({
          page: pg.page,
          pageSize: pg.pageSize,
        });
        res.json(paginatedResponse(items, total, pg));
      } catch (error) {
        next(error);
      }
    });
  });

  adminPlaceCollectionPaths.forEach((path) => {
    adminRouter.post(path, validate({ body: locationCreateSchema }), async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof locationCreateSchema>;
        const data = await createAdminPlaceRecord({ actorId: req.auth!.userId, body });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    });
  });

  adminPlaceItemPaths.forEach((path) => {
    adminRouter.patch(path, validate({ params: idParamSchema, body: locationPatchSchema }), async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof locationPatchSchema>;
        const data = await updateAdminPlaceRecord({
          actorId: req.auth!.userId,
          placeId: id,
          body,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    });
  });

  adminPlaceItemPaths.forEach((path) => {
    adminRouter.delete(path, validate({ params: idParamSchema }), async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteAdminPlaceRecord({ actorId: req.auth!.userId, placeId: id });
        res.json({ message: 'Location deleted.' });
      } catch (error) {
        next(error);
      }
    });
  });
};
