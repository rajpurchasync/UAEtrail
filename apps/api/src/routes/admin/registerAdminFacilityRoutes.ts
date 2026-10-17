import { Router } from 'express';
import { z } from 'zod';
import { FACILITY_KINDS, type FacilityKind } from '@uaetrail/shared-types';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  createAdminFacilityRecord,
  deleteAdminFacilityRecord,
  updateAdminFacilityRecord,
} from '../../services/admin-facility-commands.js';
import { listAdminFacilitiesPage } from '../../services/admin-facility-read.js';

const facilityKindSchema = z.enum(FACILITY_KINDS as [FacilityKind, ...FacilityKind[]]);

const facilityFieldsSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  areaLabel: z.string().min(2).max(120).optional().nullable(),
  areaId: z.string().min(1).max(80),
  facilityKind: facilityKindSchema,
  parentPlaceId: z.string().min(1).max(80).optional().nullable(),
  description: z.string().min(20),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'inactive']).default('active'),
  countryCode: z.string().length(2).optional(),
});

const requireActiveFacilityImagesOnCreate = (
  data: { status?: 'draft' | 'active' | 'inactive'; images: string[] },
  ctx: z.RefinementCtx
) => {
  const status = data.status ?? 'active';
  if (status === 'active' && data.images.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Active facilities must include at least one image URL',
      path: ['images'],
    });
  }
};

const facilityCreateSchema = facilityFieldsSchema.superRefine(requireActiveFacilityImagesOnCreate);
const facilityPatchSchema = facilityFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.status === 'active' && data.images !== undefined && data.images.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Active facilities must include at least one image URL',
      path: ['images'],
    });
  }
});

const idParamSchema = z.object({ id: z.string().min(1) });

/** Platform admin facility CRUD — canonical `facilities` collection (CPC-7: no `locations` dual-write). */
export const registerAdminFacilityRoutes = (adminRouter: Router): void => {
  adminRouter.get('/facilities', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listAdminFacilitiesPage({
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/facilities', validate({ body: facilityCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof facilityCreateSchema>;
      const data = await createAdminFacilityRecord({ actorId: req.auth!.userId, body });
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  });

  adminRouter.patch(
    '/facilities/:id',
    validate({ params: idParamSchema, body: facilityPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof facilityPatchSchema>;
        const data = await updateAdminFacilityRecord({
          actorId: req.auth!.userId,
          facilityId: id,
          body,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  adminRouter.delete(
    '/facilities/:id',
    validate({ params: idParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        await deleteAdminFacilityRecord({ actorId: req.auth!.userId, facilityId: id });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};
