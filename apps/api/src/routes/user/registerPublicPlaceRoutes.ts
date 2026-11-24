import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { paginatedResponse } from '../../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { viewLimiter } from '../../middleware/rate-limit-instances.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../domain/enums.js';
import { createPublicPlacePremiumCheckout } from '../../services/place-premium-commands.js';
import { listPublicPlaceReachableRides } from '../../services/place-reachable-rides-read.js';
import {
  loadExploreMapForViewer,
  loadPublicPlaceCatalog,
  loadPublicPlaceDetailPayload,
  loadPublicPlaceTrackPreview,
  loadPublicPlacePremiumGuideContent,
  loadPublicPlaceRegistry,
  listPopularPublicPlaces,
  listPublicPlaceUpcomingActivities,
  listPublicPlacesPaged,
  readPublicPlacePremiumGuidePdfFile,
  readPublicPlacePremiumMapFile,
  recordPublicPlaceView,
} from '../../services/place-public-read.js';
import { finishCatalogEtag, readCatalogResponseEtag } from '../../lib/explore-catalog-etag.js';
import { readExploreMapMemoryCache } from '../../lib/explore-map-cache.js';
import type { ExploreMapRouteResult } from '../../lib/explore-map-route.js';
import { sendNotModifiedIfMatch } from '../../lib/http-etag.js';
import { resolveExploreDestinationSlugQuery } from '@uaetrail/shared-types';
import {
  eventIdParamSchema,
  listFilterSchema,
  placeCatalogQuerySchema,
  placeRegistryQuerySchema,
} from './schemas.js';

/** Public explore map + place catalog (`/places`; `/locations` legacy alias). */
export const registerPublicPlaceRoutes = (router: Router): void => {
  router.get('/explore/map', async (req, res, next) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const projection = query.projection?.trim();
      const destinationSlug = resolveExploreDestinationSlugQuery({
        destination: query.destination,
      });
      const unscoped =
        !query.bbox &&
        !query.cursor &&
        !query.limit &&
        !destinationSlug &&
        !query.sources;
      const catalogFresh = unscoped && projection !== 'full' && readExploreMapMemoryCache() != null;
      if (catalogFresh && sendNotModifiedIfMatch(req, res, await readCatalogResponseEtag('map'))) return;
      const data = await loadExploreMapForViewer({
        query: {
          bbox: query.bbox,
          cursor: query.cursor,
          limit: query.limit,
          area: destinationSlug ?? undefined,
          destination: query.destination,
          q: query.q,
          country: query.country,
          venue: query.venue,
          projection,
          sources: query.sources,
          includeRideshare: query.includeRideshare,
        },
        viewerUserId: null,
        userRole: null,
      });
      const payload: ExploreMapRouteResult = data;
      if (unscoped && projection !== 'full' && (await finishCatalogEtag(req, res, 'map', payload))) return;
      res.json({ data: payload });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(router, 'get', '/places', validate({ query: listFilterSchema }), async (req, res, next) => {
    try {
      const filters = req.query as unknown as z.infer<typeof listFilterSchema>;
      const pg = { page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
      const { items, total } = await listPublicPlacesPaged({
        activityType: filters.activityType,
        featured: filters.featured,
        countryCode: filters.countryCode,
        q: filters.q,
        country: filters.country,
        area: filters.area,
        venue: filters.venue,
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items, total, pg));
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    router,
    'get',
    '/places/registry',
    optionalAuth,
    validate({ query: placeRegistryQuerySchema }),
    async (req, res, next) => {
      try {
        const filters = req.query as z.infer<typeof placeRegistryQuerySchema>;
        const data = await loadPublicPlaceRegistry({
          activityType: filters.activityType,
          countryCode: filters.countryCode,
          userId: req.auth?.userId ?? null,
          platformAdmin: req.auth?.role === UserRole.PLATFORM_ADMIN,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/catalog',
    optionalAuth,
    validate({ query: placeCatalogQuerySchema }),
    async (req, res, next) => {
      try {
        const filters = req.query as z.infer<typeof placeCatalogQuerySchema>;
        const data = await loadPublicPlaceCatalog({
          ...filters,
          userId: req.auth?.userId ?? null,
          platformAdmin: req.auth?.role === UserRole.PLATFORM_ADMIN,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(router, 'get', '/places/popular', async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 6, 20);
      const data = await listPopularPublicPlaces(limit);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/activities',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await listPublicPlaceUpcomingActivities(id);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/reachable-rides',
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const payload = await listPublicPlaceReachableRides({ placeId: id, page, pageSize });
        res.json(payload);
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/track',
    optionalAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await loadPublicPlaceTrackPreview({
          placeId: id,
          viewerUserId: req.auth?.userId ?? null,
          viewerRole: req.auth?.role ?? null,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/me/state',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const payload = await loadPublicPlaceDetailPayload({
          placeId: id,
          viewerUserId: req.auth!.userId,
          viewerRole: req.auth?.role ?? null,
        });
        res.setHeader('Cache-Control', 'private, no-store');
        res.json(payload);
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id',
    optionalAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const payload = await loadPublicPlaceDetailPayload({
          placeId: id,
          viewerUserId: req.auth?.userId ?? null,
          viewerRole: req.auth?.role ?? null,
        });
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        res.json(payload);
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/premium/guide',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const data = await loadPublicPlacePremiumGuideContent({
          placeId: id,
          userId: req.auth!.userId,
          userRole: req.auth!.role as UserRole,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/premium/map/download',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const file = await readPublicPlacePremiumMapFile({
          placeId: id,
          userId: req.auth!.userId,
          userRole: req.auth!.role as UserRole,
        });
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/places/:id/premium/guide/pdf',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const file = await readPublicPlacePremiumGuidePdfFile({
          placeId: id,
          userId: req.auth!.userId,
          userRole: req.auth!.role as UserRole,
        });
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'post',
    '/places/:id/premium/checkout',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const result = await createPublicPlacePremiumCheckout({
          placeId: id,
          userId: req.auth!.userId,
          userRole: req.auth!.role as UserRole,
        });
        if (result.kind === 'already_unlocked') {
          res.json({
            data: {
              alreadyUnlocked: true,
              premium: result.premium,
            },
          });
          return;
        }
        if (result.kind === 'free_unlock') {
          res.json({
            data: {
              alreadyUnlocked: false,
              premium: result.premium,
            },
            message: result.message,
          });
          return;
        }
        res.json({
          data: {
            sessionId: result.sessionId,
            url: result.url,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /** @deprecated Use POST /locations/:id/premium/checkout */
  registerPlaceAlias(
    router,
    'post',
    '/places/:id/premium/unlock',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema }),
    (_req, _res, next) => {
      next(
        new ApiError(
          402,
          'payment_required',
          'Direct unlock is disabled. Use POST /locations/:id/premium/checkout.'
        )
      );
    }
  );

  registerPlaceAlias(
    router,
    'post',
    '/places/:id/view',
    viewLimiter,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        await recordPublicPlaceView(id);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    }
  );
};
