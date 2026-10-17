import type { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  createMeWishlistItem,
  deleteMeWishlistItem,
  updateMeWishlistAlert,
} from '../../services/me-wishlist-commands.js';
import { checkMeWishlistTarget, listMeWishlist } from '../../services/me-wishlist-read.js';

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

/** Personal wishlist — venues and activities only (`user_wishlist` Mongo collection). */
export const registerMeWishlistRoutes = (router: Router): void => {
  router.get('/me/wishlist', async (req, res, next) => {
    try {
      const data = await listMeWishlist(req.auth!.userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.post('/me/wishlist', validate({ body: wishlistCreateSchema }), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof wishlistCreateSchema>;
      const data = await createMeWishlistItem({
        userId: req.auth!.userId,
        locationId: body.locationId,
        activityId: body.activityId,
        alertOnMatch: body.alertOnMatch,
        watchOutingCategory: body.watchOutingCategory ?? null,
        watchLatitude: body.watchLatitude ?? null,
        watchLongitude: body.watchLongitude ?? null,
      });
      res.status(201).json({ data });
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
        const data = await updateMeWishlistAlert({
          id,
          userId: req.auth!.userId,
          alertOnMatch: body.alertOnMatch,
        });
        res.json({ data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete('/me/wishlist/:id', validate({ params: idParamSchema }), async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      await deleteMeWishlistItem({ id, userId: req.auth!.userId });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/wishlist/check', async (req, res, next) => {
    try {
      const locationId = req.query.locationId as string | undefined;
      const activityId = req.query.activityId as string | undefined;
      const data = await checkMeWishlistTarget({
        userId: req.auth!.userId,
        locationId,
        activityId,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });
};
