import type { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { paginatedResponse } from '../../lib/pagination.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { buildFacilityCatalog } from '../../services/place-catalog.js';
import {
  listPublicFacilitiesPaged,
  loadPublicFacilityDetail,
} from '../../services/facility-public-read.js';
import type { FacilityCatalogQuery } from '@uaetrail/shared-types';
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
        const filters = req.query as z.infer<typeof facilityCatalogQuerySchema>;
        const data = await buildFacilityCatalog(filters as FacilityCatalogQuery);
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
};
