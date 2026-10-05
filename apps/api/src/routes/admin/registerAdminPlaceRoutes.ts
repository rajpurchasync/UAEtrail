import {
  Accessibility,
  ActivityType,
  Difficulty,
  LocationStatus,
  NotificationType,
  RewardAction,
} from '../../domain/enums.js';
import { placeDetailPath } from '@uaetrail/shared-types';
import { Router } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../lib/audit.js';
import { ApiError } from '../../lib/api-error.js';
import { toLocationDto } from '../../lib/mappers.js';
import { invalidateExploreMapCache } from '../../lib/explore-map-cache.js';
import { awardPoints } from '../../services/rewards.js';
import {
  locationHasCatalogImportTag,
  withCatalogAdminEditedTag,
  VENUE_CATALOG_EXTERNAL_SOURCE,
} from '../../lib/venue-catalog.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { validate } from '../../middleware/validate.js';
import {
  countActiveEventsByLocationId,
  createAdminLocation,
  deleteAdminLocation,
  findAdminLocationById,
  listAdminPlacesPaged,
  updateAdminLocation,
} from '../../lib/admin-store.js';
import { EXPLORE_VENUES_LIST_PATH } from '../../lib/member-routes.js';
import { dispatchNotification } from '../../services/notifications.js';
import { notifyUserAdminAction } from '../../services/admin-notifications.js';

const locationCreateSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  activityType: z.enum(['hiking', 'camping', 'event', 'shop', 'EVENT', 'community_activity', 'COMMUNITY_ACTIVITY']),
  description: z.string().min(20),
  difficulty: z.enum(['easy', 'moderate', 'hard']).optional(),
  season: z.array(z.string()).min(1),
  childFriendly: z.boolean().default(false),
  maxGroupSize: z.number().int().positive().optional(),
  accessibility: z.enum(['car-accessible', 'remote']).optional(),
  images: z.array(z.string().url()).default([]),
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
  accessibleBy: z.array(z.string()).default([]),
  countryCode: z.string().length(2).optional(),
  gpxKey: z.string().max(500).optional().nullable(),
  guidePdfKey: z.string().max(500).optional().nullable(),
  guideMarkdown: z.string().max(50000).optional().nullable(),
  guidePreview: z.string().max(2000).optional().nullable(),
  unlockPriceAed: z.number().int().min(0).max(9999).optional(),
});

const locationPatchSchema = locationCreateSchema.partial();

const idParamSchema = z.object({ id: z.string().min(1) });

const toPrismaActivityType = (activityType: string): ActivityType => {
  const normalized = activityType.toLowerCase();
  if (normalized === 'hiking') return ActivityType.HIKING;
  if (normalized === 'camping') return ActivityType.CAMPING;
  if (normalized === 'shop') return ActivityType.SHOP;
  return ActivityType.EVENT;
};

const toPrismaDifficulty = (difficulty?: 'easy' | 'moderate' | 'hard'): Difficulty | undefined => {
  if (!difficulty) return undefined;
  if (difficulty === 'easy') return Difficulty.EASY;
  if (difficulty === 'moderate') return Difficulty.MODERATE;
  return Difficulty.HARD;
};

const toPrismaAccessibility = (
  accessibility?: 'car-accessible' | 'remote'
): Accessibility | undefined => {
  if (!accessibility) return undefined;
  return accessibility === 'car-accessible' ? 'CAR_ACCESSIBLE' : 'REMOTE';
};

const toPrismaLocationStatus = (status?: 'draft' | 'active' | 'inactive'): LocationStatus | undefined => {
  if (!status) return undefined;
  if (status === 'draft') return 'DRAFT';
  return status === 'active' ? 'ACTIVE' : 'INACTIVE';
};

const adminPlaceCollectionPaths = ['/locations', '/places'] as const;
const adminPlaceItemPaths = ['/locations/:id', '/places/:id'] as const;

/** Platform admin venue / place CRUD (`/admin/locations` and `/admin/places` aliases). */
export const registerAdminPlaceRoutes = (adminRouter: Router): void => {
  adminPlaceCollectionPaths.forEach((path) => {
    adminRouter.get(path, async (req, res, next) => {
      try {
        const pg = paginationSchema.parse(req.query);
        const { items: locations, total } = await listAdminPlacesPaged({
          skip: (pg.page - 1) * pg.pageSize,
          take: pg.pageSize,
        });
        res.json(paginatedResponse(locations.map((l) => toLocationDto(l, { admin: true })), total, pg));
      } catch (error) {
        next(error);
      }
    });
  });

  adminPlaceCollectionPaths.forEach((path) => {
    adminRouter.post(path, validate({ body: locationCreateSchema }), async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof locationCreateSchema>;
        const created = await createAdminLocation({
          name: body.name,
          region: body.region,
          activityType: toPrismaActivityType(body.activityType),
          description: body.description,
          difficulty: toPrismaDifficulty(body.difficulty),
          season: body.season,
          childFriendly: body.childFriendly,
          maxGroupSize: body.maxGroupSize,
          accessibility: toPrismaAccessibility(body.accessibility),
          images: body.images,
          featured: body.featured,
          status: toPrismaLocationStatus(body.status) ?? LocationStatus.ACTIVE,
          distance: body.distance,
          duration: body.duration,
          elevation: body.elevation,
          campingType: body.campingType,
          latitude: body.latitude,
          longitude: body.longitude,
          highlights: body.highlights ?? [],
          surfaceType: body.surfaceType ?? [],
          tags: body.tags ?? [],
          parkingLink: body.parkingLink,
          accessibleBy: body.accessibleBy ?? [],
          countryCode: body.countryCode?.toUpperCase() ?? 'AE',
        });
        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'location.create',
          entityType: 'location',
          entityId: created.id,
        });
        await invalidateExploreMapCache();
        res.status(201).json({ data: toLocationDto(created, { admin: true }) });
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

        const existing = await findAdminLocationById(id);
        if (!existing) {
          throw new ApiError(404, 'location_not_found', 'Location not found.');
        }

        const nextStatus = toPrismaLocationStatus(body.status);
        const activating =
          nextStatus === LocationStatus.ACTIVE &&
          (existing.status === LocationStatus.DRAFT || existing.status === LocationStatus.INACTIVE);
        const deactivating =
          nextStatus === LocationStatus.INACTIVE && existing.status === LocationStatus.ACTIVE;

        if (activating) {
          const activityType = body.activityType
            ? toPrismaActivityType(body.activityType)
            : existing.activityType;
          const difficulty = body.difficulty
            ? toPrismaDifficulty(body.difficulty)
            : existing.difficulty;
          const parkingLink = body.parkingLink !== undefined ? body.parkingLink : existing.parkingLink;
          const latitude = body.latitude !== undefined ? body.latitude : existing.latitude;
          const longitude = body.longitude !== undefined ? body.longitude : existing.longitude;

          if (activityType !== ActivityType.SHOP) {
            if (
              (activityType === ActivityType.HIKING || activityType === ActivityType.EVENT) &&
              !difficulty
            ) {
              throw new ApiError(
                400,
                'difficulty_required',
                'Trail and community event locations require a difficulty level before approval.'
              );
            }
            if (!parkingLink && (latitude == null || longitude == null)) {
              throw new ApiError(
                400,
                'parking_required',
                'Add a parking link or map coordinates before approving this location.'
              );
            }
          } else if (latitude == null || longitude == null) {
            throw new ApiError(
              400,
              'coords_required',
              'Community shop pins need a map location before approval.'
            );
          }
        }

        const isCatalogVenue =
          existing.externalSource === VENUE_CATALOG_EXTERNAL_SOURCE || locationHasCatalogImportTag(existing.tags);
        const tagsForUpdate = isCatalogVenue
          ? withCatalogAdminEditedTag(body.tags ?? existing.tags)
          : body.tags;

        const updated = await updateAdminLocation(id, {
          name: body.name,
          region: body.region,
          countryCode: body.countryCode?.toUpperCase(),
          activityType: body.activityType ? toPrismaActivityType(body.activityType) : undefined,
          description: body.description,
          difficulty: toPrismaDifficulty(body.difficulty),
          season: body.season,
          childFriendly: body.childFriendly,
          maxGroupSize: body.maxGroupSize,
          accessibility: toPrismaAccessibility(body.accessibility),
          images: body.images,
          featured: body.featured,
          status: nextStatus,
          ...(activating ? { registryListed: true } : {}),
          distance: body.distance,
          duration: body.duration,
          elevation: body.elevation,
          campingType: body.campingType,
          latitude: body.latitude,
          longitude: body.longitude,
          highlights: body.highlights,
          surfaceType: body.surfaceType,
          tags: tagsForUpdate,
          parkingLink: body.parkingLink,
          accessibleBy: body.accessibleBy,
          gpxKey: body.gpxKey,
          guidePdfKey: body.guidePdfKey,
          guideMarkdown: body.guideMarkdown,
          guidePreview: body.guidePreview,
          unlockPriceAed: body.unlockPriceAed,
        });

        await invalidateExploreMapCache();

        await createAuditLog({
          actorId: req.auth!.userId,
          action: activating ? 'location.approve' : 'location.update',
          entityType: 'location',
          entityId: updated.id,
        });

        if (activating && updated.submittedById) {
          const locationDto = toLocationDto(updated, { admin: true });
          const activityTypeWire = locationDto.activityType;
          const publicPath = placeDetailPath(activityTypeWire, updated.id);
          const venueLabel =
            activityTypeWire === 'shop'
              ? 'shop pin'
              : activityTypeWire === 'camping'
                ? 'camp spot'
                : activityTypeWire === 'event'
                  ? 'venue'
                  : 'trail';
          const venueTitle =
            activityTypeWire === 'shop'
              ? 'Shop pin approved'
              : venueLabel === 'trail'
                ? 'Trail'
                : venueLabel === 'camp spot'
                  ? 'Camp spot'
                  : 'Venue';
          await dispatchNotification({
            userId: updated.submittedById,
            title: activityTypeWire === 'shop' ? venueTitle : `${venueTitle} approved`,
            body:
              activityTypeWire === 'shop'
                ? `"${updated.name}" is live on Explore so others can find this shop nearby.`
                : `"${updated.name}" is live on Explore. Open your ${venueLabel} page or use it when you organize a plan.`,
            type: NotificationType.SYSTEM,
            meta: {
              locationId: updated.id,
              activityType: activityTypeWire,
              kind: 'location_approved',
              path: publicPath,
            },
          });
          void awardPoints({
            userId: updated.submittedById,
            action: RewardAction.LOCATION_PUBLISHED,
            referenceId: updated.id,
            label: `Location approved: ${updated.name}`,
          }).catch(() => undefined);
        }

        if (deactivating && updated.submittedById) {
          await notifyUserAdminAction({
            userId: updated.submittedById,
            title: 'Location not approved',
            body: `"${updated.name}" was not approved for listing. Contact support if you have questions.`,
            meta: {
              locationId: updated.id,
              kind: 'location_rejected',
              path: EXPLORE_VENUES_LIST_PATH,
            },
          });
        }

        res.json({ data: toLocationDto(updated, { admin: true }) });
      } catch (error) {
        next(error);
      }
    });
  });

  adminPlaceItemPaths.forEach((path) => {
    adminRouter.delete(path, validate({ params: idParamSchema }), async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;

        const location = await findAdminLocationById(id);
        if (!location) throw new ApiError(404, 'location_not_found', 'Location not found.');

        const activeEventCount = await countActiveEventsByLocationId(id);
        if (activeEventCount > 0) {
          throw new ApiError(
            400,
            'location_has_events',
            `Cannot delete location: ${activeEventCount} active event(s) reference it.`
          );
        }

        await deleteAdminLocation(id);

        await createAuditLog({
          actorId: req.auth!.userId,
          action: 'location.delete',
          entityType: 'location',
          entityId: id,
        });

        await invalidateExploreMapCache();
        res.json({ message: 'Location deleted.' });
      } catch (error) {
        next(error);
      }
    });
  });
};
