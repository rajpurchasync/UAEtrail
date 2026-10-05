import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createUserFavorite,
  deleteUserFavoriteById,
  findUserFavorite,
  listUserFavoritesWithDetails,
  updateUserFavorite,
} from '../lib/favorites-store.js';
import { registerSocialReviewRoutes } from './social/registerSocialReviewRoutes.js';

export const socialRouter = Router();

registerSocialReviewRoutes(socialRouter);

const idParamSchema = z.object({ id: z.string().min(1) });

// ─── Favorites (auth) ───────────────────────────────────────────────────────

const outingCategorySchema = z.enum(['hiking', 'camping', 'events', 'rideshare', 'activities']);

const favoriteCreateSchema = z
  .object({
    locationId: z.string().optional(),
    activityId: z.string().optional(),
    participantIntentId: z.string().optional(),
    productId: z.string().optional(),
    merchantId: z.string().optional(),
    tenantId: z.string().optional(),
    profileUserId: z.string().optional(),
    alertOnMatch: z.boolean().optional(),
    watchOutingCategory: outingCategorySchema.optional(),
    watchLatitude: z.number().min(-90).max(90).optional(),
    watchLongitude: z.number().min(-180).max(180).optional(),
  })
  .refine((d) => !d.participantIntentId, {
    message: 'Demand posts are not wishlist saves. Participate on the map instead.',
  })
  .refine(
    (d) =>
      [d.locationId, d.activityId, d.productId, d.merchantId, d.tenantId, d.profileUserId].filter(
        Boolean
      ).length === 1,
    { message: 'Exactly one favorite target id is required.' }
  );

socialRouter.get('/me/favorites', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const favorites = await listUserFavoritesWithDetails(req.auth!.userId);
    res.json({
      data: favorites.map((f) => ({
        id: f.id,
        locationId: f.locationId,
        activityId: f.activityId,
        participantIntentId: f.participantIntentId,
        alertOnMatch: f.alertOnMatch,
        watchOutingCategory: f.watchOutingCategory,
        watchLatitude: f.watchLatitude,
        watchLongitude: f.watchLongitude,
        productId: f.productId,
        merchantId: f.merchantId,
        tenantId: f.tenantId,
        profileUserId: f.profileUserId,
        createdAt: f.createdAt.toISOString(),
        location: f.location ? { id: f.location.id, name: f.location.name, images: f.location.images } : null,
        activity: f.activity ? { id: f.activity.id, title: f.activity.title, locationName: f.activity.locationName } : null,
        participantIntent: f.participantIntent,
        merchant: f.merchant
          ? { id: f.merchant.id, shopName: f.merchant.shopName, logo: f.merchant.logo }
          : null,
        tenant: f.tenant
          ? { id: f.tenant.id, name: f.tenant.name, slug: f.tenant.slug, logoUrl: f.tenant.logoUrl }
          : null,
        profile: f.profile
          ? { id: f.profile.id, displayName: f.profile.displayName, avatarUrl: f.profile.avatarUrl }
          : null,
        product: f.product
          ? {
              id: f.product.id,
              merchantId: f.product.merchantId,
              merchantName: f.product.merchantName,
              name: f.product.name,
              images: f.product.images,
              priceAed: f.product.priceAed,
              discountPercent: f.product.discountPercent,
              category: f.product.category
            }
          : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/me/favorites', requireAuth, requireVerifiedEmail, validate({ body: favoriteCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof favoriteCreateSchema>;
    const favorite = await createUserFavorite({
      userId: req.auth!.userId,
      locationId: body.locationId,
      activityId: body.activityId,
      participantIntentId: body.participantIntentId,
      productId: body.productId,
      merchantId: body.merchantId,
      tenantId: body.tenantId,
      profileUserId: body.profileUserId,
      alertOnMatch: body.alertOnMatch,
      watchOutingCategory: body.watchOutingCategory ?? null,
      watchLatitude: body.watchLatitude ?? null,
      watchLongitude: body.watchLongitude ?? null,
    });
    res.status(201).json({
      data: {
        id: favorite.id,
        locationId: favorite.locationId,
        activityId: favorite.activityId,
        participantIntentId: favorite.participantIntentId,
        productId: favorite.productId,
        merchantId: favorite.merchantId,
        tenantId: favorite.tenantId,
        profileUserId: favorite.profileUserId,
        alertOnMatch: favorite.alertOnMatch,
        watchOutingCategory: favorite.watchOutingCategory,
        watchLatitude: favorite.watchLatitude,
        watchLongitude: favorite.watchLongitude,
        createdAt: favorite.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

const favoritePatchSchema = z.object({
  alertOnMatch: z.boolean(),
});

socialRouter.patch(
  '/me/favorites/:id',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: idParamSchema, body: favoritePatchSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const body = req.body as z.infer<typeof favoritePatchSchema>;
      const updated = await updateUserFavorite({
        id,
        userId: req.auth!.userId,
        alertOnMatch: body.alertOnMatch,
      });
      if (!updated) {
        throw new ApiError(404, 'favorite_not_found', 'Saved item not found.');
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

socialRouter.delete('/me/favorites/:id', requireAuth, requireVerifiedEmail, validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    await deleteUserFavoriteById({ id, userId: req.auth!.userId });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

socialRouter.get('/me/favorites/check', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const locationId = req.query.locationId as string | undefined;
    const activityId = req.query.activityId as string | undefined;
    const participantIntentId = req.query.participantIntentId as string | undefined;
    const productId = req.query.productId as string | undefined;
    const merchantId = req.query.merchantId as string | undefined;
    const tenantId = req.query.tenantId as string | undefined;
    const profileUserId = req.query.profileUserId as string | undefined;
    const favorite = await findUserFavorite({
      userId: req.auth!.userId,
      locationId,
      activityId,
      participantIntentId,
      productId,
      merchantId,
      tenantId,
      profileUserId
    });
    res.json({ data: { saved: Boolean(favorite), favoriteId: favorite?.id ?? null } });
  } catch (error) {
    next(error);
  }
});
