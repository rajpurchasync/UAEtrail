import { ReviewTargetType, RewardAction } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { tierEnumToDisplay } from '../lib/membership-tier-display.js';
import { awardPoints } from '../services/rewards.js';
import { findAuthUserById, findAuthUsersByIds, getAuthUserMembershipTier } from '../lib/auth-users.js';
import {
  createUserFavorite,
  deleteUserFavoriteById,
  findUserFavorite,
  listUserFavoritesWithDetails,
  updateUserFavorite,
} from '../lib/favorites-store.js';
import { createSocialReview, listSocialReviews } from '../lib/social-data.js';
import { sanitizeUserGeneratedText } from '../lib/content-moderation.js';
import { listMyReviews, updateMyReview } from '../services/my-reviews.js';

export const socialRouter = Router();

const idParamSchema = z.object({ id: z.string().min(1) });

// ─── Reviews ────────────────────────────────────────────────────────────────

const reviewListSchema = paginationSchema.extend({
  targetType: z.enum(['location', 'tenant']),
  targetId: z.string().min(1)
});

const reviewCreateSchema = z.object({
  targetType: z.enum(['location', 'tenant']),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000)
});

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

socialRouter.get('/me/reviews', requireAuth, requireVerifiedEmail, validate({ query: paginationSchema }), async (req, res, next) => {
  try {
    const { page, pageSize } = req.query as unknown as z.infer<typeof paginationSchema>;
    const skip = (page - 1) * pageSize;
    const { items, total } = await listMyReviews({
      userId: req.auth!.userId,
      skip,
      take: pageSize,
    });
    res.json(paginatedResponse(items, total, { page, pageSize }));
  } catch (error) {
    next(error);
  }
});

socialRouter.patch(
  '/me/reviews/:id',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: idParamSchema, body: reviewUpdateSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const body = req.body as z.infer<typeof reviewUpdateSchema>;
      const sanitizedComment = sanitizeUserGeneratedText(body.comment).trim();
      if (sanitizedComment.length < 10) {
        throw new ApiError(400, 'invalid_comment_content', 'Comment cannot contain only links or phone numbers.');
      }
      const data = await updateMyReview({
        userId: req.auth!.userId,
        reviewId: id,
        rating: body.rating,
        comment: sanitizedComment,
      });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

socialRouter.get('/reviews', validate({ query: reviewListSchema }), async (req, res, next) => {
  try {
    const { targetType, targetId, page, pageSize } = req.query as unknown as z.infer<typeof reviewListSchema>;
    const pg = { page, pageSize };
    const where = {
      targetType: targetType === 'location' ? ReviewTargetType.LOCATION : ReviewTargetType.TENANT,
      targetId
    };
    const { items: reviews, total } = await listSocialReviews({
      targetType: where.targetType,
      targetId: where.targetId,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize
    });
    const reviewerIds = [...new Set(reviews.map((review) => review.userId))];
    const reviewers = await findAuthUsersByIds(reviewerIds);
    const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer._id, reviewer]));
    const tierEntries = await Promise.all(
      reviewerIds.map(async (userId) => [userId, await getAuthUserMembershipTier(userId)] as const)
    );
    const tierMap = new Map(tierEntries);
    res.json(
      paginatedResponse(
        reviews.map((r) => ({
          id: r.id,
          targetType: r.targetType === ReviewTargetType.LOCATION ? 'location' : 'tenant',
          targetId: r.targetId,
          userId: r.userId,
          userName: reviewerMap.get(r.userId)?.profile.displayName ?? reviewerMap.get(r.userId)?.email.split('@')[0],
          userAvatar: reviewerMap.get(r.userId)?.profile.avatarUrl ?? null,
          userMembershipTier: tierEnumToDisplay(tierMap.get(r.userId) ?? null),
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString()
        })),
        total,
        pg
      )
    );
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/reviews', requireAuth, requireVerifiedEmail, validate({ body: reviewCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof reviewCreateSchema>;
    const sanitizedComment = sanitizeUserGeneratedText(body.comment).trim();
    if (sanitizedComment.length < 10) {
      throw new ApiError(400, 'invalid_comment_content', 'Comment cannot contain only links or phone numbers.');
    }
    const review = await createSocialReview({
      targetType: body.targetType === 'location' ? ReviewTargetType.LOCATION : ReviewTargetType.TENANT,
      targetId: body.targetId,
      userId: req.auth!.userId,
      rating: body.rating,
      comment: sanitizedComment
    });
    void awardPoints({
      userId: req.auth!.userId,
      action: RewardAction.REVIEW_WRITTEN,
      referenceId: review.id,
    }).catch(() => undefined);
    const author = await findAuthUserById(req.auth!.userId);
    const authorMembershipTier = await getAuthUserMembershipTier(req.auth!.userId);
    res.status(201).json({
      data: {
        id: review.id,
        targetType: body.targetType,
        targetId: review.targetId,
        userId: review.userId,
        userName: author?.profile.displayName ?? author?.email.split('@')[0],
        userAvatar: author?.profile.avatarUrl ?? null,
        userMembershipTier: tierEnumToDisplay(authorMembershipTier),
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

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
