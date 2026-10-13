import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import {
  createWishlistItem,
  deleteWishlistItemById,
  findWishlistItem,
  listWishlistItemsWithDetails,
  updateWishlistItem,
} from '../../lib/wishlist-store.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const outingCategorySchema = z.enum(['hiking', 'camping', 'events', 'rideshare', 'activities']);

const wishlistCreateSchema = z
  .object({
    locationId: z.string().optional(),
    activityId: z.string().optional(),
    alertOnMatch: z.boolean().optional(),
    watchOutingCategory: outingCategorySchema.optional(),
    watchLatitude: z.number().min(-90).max(90).optional(),
    watchLongitude: z.number().min(-180).max(180).optional(),
  })
  .refine((d) => Boolean(d.locationId) !== Boolean(d.activityId), {
    message: 'Wishlist saves a single venue (locationId) or activity (activityId).',
  });

const wishlistPatchSchema = z.object({
  alertOnMatch: z.boolean(),
});

const toWishlistItemDto = (row: Awaited<ReturnType<typeof listWishlistItemsWithDetails>>[number]) => ({
  id: row.id,
  locationId: row.locationId,
  activityId: row.activityId,
  alertOnMatch: row.alertOnMatch,
  watchOutingCategory: row.watchOutingCategory,
  watchLatitude: row.watchLatitude,
  watchLongitude: row.watchLongitude,
  createdAt: row.createdAt.toISOString(),
  location: row.location
    ? {
        id: row.location.id,
        name: row.location.name,
        images: row.location.images,
      }
    : null,
  activity: row.activity
    ? { id: row.activity.id, title: row.activity.title, locationName: row.activity.locationName }
    : null,
});

/** Personal wishlist — venues and activities only (`user_favorites` Mongo collection). */
export const registerMeWishlistRoutes = (router: Router): void => {
  router.get('/me/wishlist', async (req, res, next) => {
    try {
      const rows = await listWishlistItemsWithDetails(req.auth!.userId);
      const items = rows.filter((row) => row.locationId || row.activityId).map(toWishlistItemDto);
      res.json({ data: items });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/wishlist', validate({ body: wishlistCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof wishlistCreateSchema>;
      const item = await createWishlistItem({
        userId: req.auth!.userId,
        locationId: body.locationId,
        activityId: body.activityId,
        participantIntentId: undefined,
        productId: undefined,
        merchantId: undefined,
        tenantId: undefined,
        profileUserId: undefined,
        alertOnMatch: body.alertOnMatch,
        watchOutingCategory: body.watchOutingCategory ?? null,
        watchLatitude: body.watchLatitude ?? null,
        watchLongitude: body.watchLongitude ?? null,
      });
      res.status(201).json({
        data: {
          id: item.id,
          locationId: item.locationId,
          activityId: item.activityId,
          alertOnMatch: item.alertOnMatch,
          watchOutingCategory: item.watchOutingCategory,
          watchLatitude: item.watchLatitude,
          watchLongitude: item.watchLongitude,
          createdAt: item.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    '/me/wishlist/:id',
    validate({ params: idParamSchema, body: wishlistPatchSchema }),
    async (req, res, next) => {
      try {
        const { id } = req.params as z.infer<typeof idParamSchema>;
        const body = req.body as z.infer<typeof wishlistPatchSchema>;
        const updated = await updateWishlistItem({
          id,
          userId: req.auth!.userId,
          alertOnMatch: body.alertOnMatch,
        });
        if (!updated) {
          throw new ApiError(404, 'wishlist_not_found', 'Wishlist item not found.');
        }
        res.json({
          data: {
            id: updated.id,
            alertOnMatch: updated.alertOnMatch,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete('/me/wishlist/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      await deleteWishlistItemById({ id, userId: req.auth!.userId });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/wishlist/check', async (req, res, next) => {
    try {
      const locationId = req.query.locationId as string | undefined;
      const activityId = req.query.activityId as string | undefined;
      const item = await findWishlistItem({
        userId: req.auth!.userId,
        locationId,
        activityId,
        participantIntentId: undefined,
        productId: undefined,
        merchantId: undefined,
        tenantId: undefined,
        profileUserId: undefined,
      });
      res.json({
        data: {
          saved: Boolean(item),
          wishlistItemId: item?.id ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  });
};
