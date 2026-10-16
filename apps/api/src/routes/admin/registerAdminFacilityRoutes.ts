import { Router } from 'express';
import { z } from 'zod';
import { FACILITY_KINDS, mergeVenueAreaTag, tagsForPlaceKind, type FacilityKind } from '@uaetrail/shared-types';
import { LocationStatus } from '../../domain/enums.js';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import {
  createAdminFacility,
  deleteAdminFacility,
  findFacilityById,
  listAdminFacilitiesPaged,
  updateAdminFacility,
} from '../../lib/facilities-store.js';
import { toFacilityDto } from '../../lib/facility-mappers.js';
import { invalidateExploreMapCache } from '../../lib/explore-map-cache.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import { scheduleSideEffect } from '../../lib/schedule-side-effect.js';

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

const toPrismaLocationStatus = (status?: 'draft' | 'active' | 'inactive'): LocationStatus => {
  if (status === 'draft') return LocationStatus.DRAFT;
  return status === 'inactive' ? LocationStatus.INACTIVE : LocationStatus.ACTIVE;
};

/** Platform admin facility CRUD — canonical `facilities` collection (CPC-7: no `locations` dual-write). */
export const registerAdminFacilityRoutes = (adminRouter: Router): void => {
  adminRouter.get('/facilities', async (req, res, next) => {
    try {
      const pg = paginationSchema.parse(req.query);
      const { items, total } = await listAdminFacilitiesPaged({
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });
      res.json(paginatedResponse(items.map((f) => toFacilityDto(f)), total, pg));
    } catch (error) {
      next(error);
    }
  });

  adminRouter.post('/facilities', validate({ body: facilityCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof facilityCreateSchema>;
      const areaLabel = body.areaLabel?.trim() || null;
      const tags = mergeVenueAreaTag(
        [...tagsForPlaceKind(body.facilityKind), ...(body.tags ?? [])],
        areaLabel
      );

      const facility = await createAdminFacility({
        name: body.name,
        region: body.region,
        areaLabel,
        areaId: body.areaId.trim(),
        facilityKind: body.facilityKind,
        parentPlaceId: body.parentPlaceId?.trim() || null,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        images: body.images,
        tags,
        featured: body.featured,
        status: toPrismaLocationStatus(body.status),
        countryCode: body.countryCode?.toUpperCase() ?? 'AE',
        createdByUserId: req.auth!.userId,
      });

      await createAuditLog({
        actorId: req.auth!.userId,
        action: 'facility.create',
        entityType: 'facility',
        entityId: facility.id,
      });
      scheduleSideEffect(invalidateExploreMapCache(), 'admin.facility_create_map_cache');
      res.status(201).json({ data: toFacilityDto(facility) });
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
        const existing = await findFacilityById(id);
        if (!existing) {
          throw new ApiError(404, 'facility_not_found', 'Facility not found.');
        }

        const facilityKind = body.facilityKind ?? existing.facilityKind;
        const areaLabel =
          body.areaLabel !== undefined ? body.areaLabel?.trim() || null : existing.areaLabel;
        const tags =
          body.facilityKind || body.tags
            ? mergeVenueAreaTag(
                [
                  ...tagsForPlaceKind(facilityKind),
                  ...(body.tags ?? existing.tags ?? []).filter((t) => !t.startsWith('place-kind:')),
                ],
                areaLabel
              )
            : undefined;

        const refreshed = await updateAdminFacility(id, {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.region !== undefined ? { region: body.region } : {}),
          ...(areaLabel !== undefined ? { areaLabel } : {}),
          ...(body.areaId !== undefined ? { areaId: body.areaId.trim() } : {}),
          ...(body.facilityKind !== undefined ? { facilityKind: body.facilityKind } : {}),
          ...(body.parentPlaceId !== undefined
            ? { parentPlaceId: body.parentPlaceId?.trim() || null }
            : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
          ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
          ...(body.images !== undefined ? { images: body.images } : {}),
          ...(body.featured !== undefined ? { featured: body.featured } : {}),
          ...(body.status !== undefined ? { status: toPrismaLocationStatus(body.status) } : {}),
          ...(tags ? { tags } : {}),
          ...(body.countryCode !== undefined
            ? { countryCode: body.countryCode.toUpperCase() }
            : {}),
        });

        if (!refreshed) {
          throw new ApiError(404, 'facility_not_found', 'Facility not found.');
        }

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'facility.update',
          entityType: 'facility',
          entityId: id,
        });
        scheduleSideEffect(invalidateExploreMapCache(), 'admin.facility_update_map_cache');
        res.json({ data: toFacilityDto(refreshed) });
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
        const existing = await findFacilityById(id);
        if (!existing) {
          throw new ApiError(404, 'facility_not_found', 'Facility not found.');
        }
        await deleteAdminFacility(id);
        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'facility.delete',
          entityType: 'facility',
          entityId: id,
        });
        scheduleSideEffect(invalidateExploreMapCache(), 'admin.facility_delete_map_cache');
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );
};
