import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { validate } from '../../middleware/validate.js';
import { loadDiscoverCrewRecommendations } from '../../services/discover-crew-recommendations.js';
import { loadDiscoverMapRecommendations } from '../../services/discover-map-recommendations.js';

const isoDay = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const mapGeoCoord = z.coerce.number().finite().min(-180).max(180);

const mapQuerySchema = z
  .object({
    surface: z.literal('map'),
    limit: z.coerce.number().int().min(1).max(20).optional(),
    lat: mapGeoCoord.optional(),
    lng: mapGeoCoord.optional(),
  })
  .refine((q) => (q.lat == null) === (q.lng == null), {
    message: 'lat and lng must be provided together',
  });

const crewQuerySchema = z.object({
  surface: z.literal('crew'),
  limit: z.coerce.number().int().min(1).max(25).optional(),
  from: isoDay,
  to: isoDay,
  date: z.string().trim().max(32).optional(),
  destination: z.string().trim().max(80).optional(),
  kind: z.enum(['hiking', 'camping', 'rideshare', 'guide']).optional(),
});

const discoverRecommendationsQuerySchema = z.discriminatedUnion('surface', [
  mapQuerySchema,
  crewQuerySchema,
]);

/** Discover layer — ranked recommendations (`GET /discover/recommendations`). */
export const registerDiscoverRecommendationsRoutes = (router: Router): void => {
  router.get(
    '/discover/recommendations',
    optionalAuth,
    validate({ query: discoverRecommendationsQuerySchema }),
    async (req, res, next) => {
      try {
        const query = discoverRecommendationsQuerySchema.parse(req.query);
        if (query.surface === 'crew') {
          const viewerUserId = req.auth?.userId;
          if (!viewerUserId) {
            throw new ApiError(401, 'unauthorized', 'Authentication is required for crew recommendations');
          }
          const data = await loadDiscoverCrewRecommendations({
            viewerUserId,
            userRole: req.auth?.role,
            limit: query.limit,
            rangeStart: query.from ?? null,
            rangeEnd: query.to ?? null,
            datePresetRaw: query.date ?? null,
            destinationSlug: query.destination ?? null,
            kind: query.kind ?? null,
          });
          res.json({ data });
          return;
        }

        const viewerGeo =
          query.lat != null && query.lng != null ? { lat: query.lat, lng: query.lng } : null;
        const data = await loadDiscoverMapRecommendations({
          viewerUserId: req.auth?.userId ?? null,
          limit: query.limit,
          viewerGeo,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};