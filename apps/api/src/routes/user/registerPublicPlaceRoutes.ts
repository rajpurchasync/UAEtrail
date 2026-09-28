import type { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ActivityType, LocationUnlockSource } from '../../domain/enums.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/api-error.js';
import {
  findActiveLocationById,
  incrementActiveLocationViewCount,
  listPopularActiveLocations,
  listPublishedUpcomingActivitiesByLocation,
} from '../../lib/activities-store.js';
import { buildExploreMapPayload } from '../../lib/explore-map.js';
import { listActiveLocations } from '../../lib/location-query.js';
import { buildActivityDto, toLocationDto } from '../../lib/mappers.js';
import { paginatedResponse } from '../../lib/pagination.js';
import { registerPlaceAlias } from '../../lib/route-place-alias.js';
import { buildPlaceRegistry } from '../../services/place-registry.js';
import { UserRole } from '../../domain/enums.js';
import { getStripe, isStripeConfigured } from '../../lib/stripe.js';
import {
  assertPremiumAccess,
  buildPremiumSummary,
  checkPremiumAccess,
  locationHasPremiumContent,
  readStoredFile,
  unlockLocationForUser,
} from '../../services/location-premium.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/optional-auth.js';
import { viewLimiter } from '../../middleware/rate-limit-instances.js';
import { validate } from '../../middleware/validate.js';
import { eventIdParamSchema, listFilterSchema, placeRegistryQuerySchema } from './schemas.js';

const locationDetailPath = (location: { id: string; activityType: ActivityType }) => {
  if (location.activityType === ActivityType.CAMPING) return `/camp/${location.id}`;
  if (location.activityType === ActivityType.EVENT || location.activityType === ActivityType.COMMUNITY_ACTIVITY) {
    return `/event/${location.id}`;
  }
  return `/trail/${location.id}`;
};

const listLocationActivitiesHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof eventIdParamSchema>;
    const events = await listPublishedUpcomingActivitiesByLocation(id, 20);
    res.json({ data: events.map((event) => buildActivityDto(event)) });
  } catch (error) {
    next(error);
  }
};

/** Public explore map + place (`/locations`) discovery and premium access. */
export const registerPublicPlaceRoutes = (router: Router): void => {
  router.get('/explore/map', async (_req, res, next) => {
    try {
      const data = await buildExploreMapPayload();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(router, 'get', '/locations', validate({ query: listFilterSchema }), async (req, res, next) => {
    try {
      const filters = req.query as z.infer<typeof listFilterSchema>;
      const pg = { page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
      const { items, total } = await listActiveLocations({
        activityType: filters.activityType,
        featured: filters.featured,
        countryCode: filters.countryCode,
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        page: pg.page,
        pageSize: pg.pageSize,
      });
      res.json(paginatedResponse(items.map((l) => toLocationDto(l)), total, pg));
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
        const platformAdmin = req.auth?.role === UserRole.PLATFORM_ADMIN;
        const data = await buildPlaceRegistry({
          activityType: filters.activityType,
          countryCode: filters.countryCode,
          userId: req.auth?.userId ?? null,
          platformAdmin,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(router, 'get', '/locations/popular', async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 6, 20);
      const locations = await listPopularActiveLocations(limit);
      res.json({ data: locations.map((l) => toLocationDto(l)) });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    router,
    'get',
    '/locations/:id/activities',
    validate({ params: eventIdParamSchema }),
    listLocationActivitiesHandler
  );

  registerPlaceAlias(router, 'get', '/locations/:id', optionalAuth, validate({ params: eventIdParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof eventIdParamSchema>;
      const location = await findActiveLocationById(id);
      if (!location) {
        throw new ApiError(404, 'location_not_found', 'Location not found.');
      }

      const access = await checkPremiumAccess(req.auth?.userId ?? null, id, req.auth?.role);
      const premium = locationHasPremiumContent(location) ? buildPremiumSummary(location, access) : null;

      res.json({ data: toLocationDto(location), premium });
    } catch (error) {
      next(error);
    }
  });

  registerPlaceAlias(
    router,
    'get',
    '/locations/:id/premium/guide',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const location = await findActiveLocationById(id);
        if (!location) {
          throw new ApiError(404, 'location_not_found', 'Location not found.');
        }
        if (!location.guideMarkdown && !location.guidePdfKey) {
          throw new ApiError(404, 'guide_not_available', 'No guide content for this location.');
        }

        await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

        res.json({
          data: {
            locationId: id,
            locationName: location.name,
            markdown: location.guideMarkdown ?? null,
            hasPdf: Boolean(location.guidePdfKey),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  registerPlaceAlias(
    router,
    'get',
    '/locations/:id/premium/map/download',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const location = await findActiveLocationById(id);
        if (!location) {
          throw new ApiError(404, 'location_not_found', 'Location not found.');
        }
        if (!location.gpxKey) {
          throw new ApiError(404, 'map_not_available', 'No route map file for this location.');
        }

        await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

        const file = await readStoredFile(location.gpxKey);
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
    '/locations/:id/premium/guide/pdf',
    requireAuth,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const location = await findActiveLocationById(id);
        if (!location?.guidePdfKey) {
          throw new ApiError(404, 'guide_pdf_not_available', 'No PDF guide for this location.');
        }

        await assertPremiumAccess(req.auth!.userId, id, req.auth!.role);

        const file = await readStoredFile(location.guidePdfKey);
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
    '/locations/:id/premium/checkout',
    requireAuth,
    requireVerifiedEmail,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        const location = await findActiveLocationById(id);
        if (!location) {
          throw new ApiError(404, 'location_not_found', 'Location not found.');
        }
        if (!locationHasPremiumContent(location)) {
          throw new ApiError(400, 'no_premium_content', 'This location has no premium map or guide content.');
        }

        const access = await checkPremiumAccess(req.auth!.userId, id, req.auth!.role);
        if (access.hasAccess) {
          res.json({
            data: {
              alreadyUnlocked: true,
              premium: buildPremiumSummary(location, access),
            },
          });
          return;
        }

        if (location.unlockPriceAed === 0) {
          const unlocked = await unlockLocationForUser(req.auth!.userId, id, LocationUnlockSource.PURCHASE);
          res.json({
            data: {
              alreadyUnlocked: false,
              premium: buildPremiumSummary(location, unlocked),
            },
            message: 'Location unlocked. Map and guide access is now available.',
          });
          return;
        }

        if (!isStripeConfigured()) {
          throw new ApiError(
            503,
            'checkout_unavailable',
            'Online payment is not available yet. Try again later or upgrade to Pro/GOAT membership.'
          );
        }

        const stripe = await getStripe();
        const returnPath = locationDetailPath(location);
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          success_url: `${env.APP_BASE_URL}${returnPath}?unlock=success`,
          cancel_url: `${env.APP_BASE_URL}${returnPath}?unlock=cancelled`,
          client_reference_id: `${req.auth!.userId}:${id}`,
          metadata: {
            type: 'location_unlock',
            userId: req.auth!.userId,
            locationId: id,
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'aed',
                unit_amount: location.unlockPriceAed * 100,
                product_data: {
                  name: `${location.name} — premium access`,
                  description: 'One-time unlock: route map and guide for this location.',
                },
              },
            },
          ],
        });

        res.json({
          data: {
            sessionId: session.id,
            url: session.url,
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
    '/locations/:id/premium/unlock',
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
    '/locations/:id/view',
    viewLimiter,
    validate({ params: eventIdParamSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof eventIdParamSchema>;
        await incrementActiveLocationViewCount(id);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    }
  );
};
