import type { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { paginatedResponse } from '../../lib/pagination.js';
import { requireAuth } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { buildFacilityCatalog } from '../../services/place-catalog.js';
import {
  listPublicFacilitiesPaged,
  loadPublicFacilityDetail,
} from '../../services/facility-public-read.js';
import { normalizeFacilityCatalogQuery, type FacilityCatalogQuery } from '@uaetrail/shared-types';
import {
  eventIdParamSchema,
  facilityCatalogQuerySchema,
  facilitiesListQuerySchema,
} from './schemas.js';

export const registerPublicFacilityRoutes = (router: Router): void => {
  router.get(
    '/facilities',
    optionalAuth,
    validate({ query: facilitiesListQuerySchema }),
    async (req, res, next) => {
      try {
        const filters = req.query as z.infer<typeof facilitiesListQuerySchema>;
        const pg = { page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
        const { items, total } = await listPublicFacilitiesPaged({
          page: pg.page,
          pageSize: pg.pageSize,
          countryCode: filters.countryCode,
        });
        res.json(paginatedResponse(items, total, pg));
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/facilities/catalog',
    optionalAuth,
    validate({ query: facilityCatalogQuerySchema }),
    async (req, res, next) => {
      try {
        const raw = req.query as z.infer<typeof facilityCatalogQuerySchema>;
        const filters = normalizeFacilityCatalogQuery({
          ...raw,
          facilityKind: raw.facilityKind as FacilityCatalogQuery['facilityKind'],
        });
        const data = await buildFacilityCatalog(filters);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  const facilityDetailHandler: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const payload = await loadPublicFacilityDetail({
        facilityId: id,
        viewerUserId: req.auth?.userId ?? null,
        viewerRole: req.auth?.role ?? null,
      });
      res.json(payload);
    } catch (error) {
      next(error);
    }
  };

  router.get('/facilities/:id', optionalAuth, validate({ params: eventIdParamSchema }), facilityDetailHandler);

  router.post(
    '/facilities/:id/condition-reports',
    requireAuth,
    validate({
      params: eventIdParamSchema,
      body: z.object({
        amenityState: z.enum(['working', 'not_working', 'unknown']),
        note: z.string().max(500).optional(),
        photoUrl: z.string().min(1).max(2048),
      }),
    }),
    async (req, res, next) => {
      try {
        const { createAmenityReport } = await import('../../services/amenity-reports.js');
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const body = req.body as {
          amenityState: 'working' | 'not_working' | 'unknown';
          note?: string;
          photoUrl: string;
        };
        const data = await createAmenityReport({
          facilityId: id,
          userId: req.auth!.userId,
          amenityState: body.amenityState,
          note: body.note,
          photoUrl: body.photoUrl,
        });
        res.status(201).json({ data: { id: data._id, status: data.status } });
      } catch (error) {
        next(error);
      }
    }
  );
};
