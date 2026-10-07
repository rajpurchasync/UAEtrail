import type { Router } from 'express';
import { z } from 'zod';
import { ReviewTargetType, RewardAction } from '../../domain/enums.js';
import {
  reviewTargetEnumToWire,
  reviewTargetWireToEnum,
  type ReviewTargetWire,
} from '../../domain/review-target-wire.js';
import { ApiError } from '../../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { tierEnumToDisplay } from '../../lib/membership-tier-display.js';
import { awardPoints } from '../../services/rewards.js';
import { findAuthUserById, findAuthUsersByIds, getAuthUserMembershipTier } from '../../lib/auth-users.js';
import { createSocialReview, listSocialReviews, type SocialReview } from '../../lib/social-data.js';
import { sanitizeUserGeneratedText } from '../../lib/content-moderation.js';
import { listMyReviews, updateMyReview } from '../../services/my-reviews.js';
import { assertViewerCanReviewActivity } from '../../services/activity-review-gate.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const reviewTargetWireSchema = z.enum(['location', 'tenant', 'activity']);

const reviewListSchema = paginationSchema.extend({
  targetType: reviewTargetWireSchema,
  targetId: z.string().min(1),
});

const reviewCreateSchema = z.object({
  targetType: reviewTargetWireSchema,
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

const mapReviewRow = async (
  review: SocialReview,
  reviewerMap: Map<string, Awaited<ReturnType<typeof findAuthUsersByIds>>[number]>,
  tierMap: Map<string, string | null>
) => {
  const reviewer = reviewerMap.get(review.userId);
  return {
    id: review.id,
    targetType: reviewTargetEnumToWire(review.targetType),
    targetId: review.targetId,
    userId: review.userId,
    userName: reviewer?.profile.displayName ?? reviewer?.email.split('@')[0],
    userAvatar: reviewer?.profile.avatarUrl ?? null,
    userMembershipTier: tierEnumToDisplay(tierMap.get(review.userId) ?? null),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
};

/** Place, host/shop, and activity reviews (`social_reviews`). */
export const registerSocialReviewRoutes = (router: Router): void => {
  router.get(
    '/me/reviews',
    requireAuth,
    requireVerifiedEmail,
    validate({ query: paginationSchema }),
    async (req, res, next) => {
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
    }
  );

  router.patch(
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

  router.get('/reviews', validate({ query: reviewListSchema }), async (req, res, next) => {
    try {
      const { targetType, targetId, page, pageSize } = req.query as unknown as z.infer<
        typeof reviewListSchema
      >;
      const pg = { page, pageSize };
      const domainType = reviewTargetWireToEnum(targetType as ReviewTargetWire);
      const { items: reviews, total } = await listSocialReviews({
        targetType: domainType,
        targetId,
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize,
      });
      const reviewerIds = [...new Set(reviews.map((review) => review.userId))];
      const reviewers = await findAuthUsersByIds(reviewerIds);
      const reviewerMap = new Map(reviewers.map((reviewer) => [reviewer._id, reviewer]));
      const tierEntries = await Promise.all(
        reviewerIds.map(async (userId) => [userId, await getAuthUserMembershipTier(userId)] as const)
      );
      const tierMap = new Map(tierEntries);
      const rows = await Promise.all(reviews.map((r) => mapReviewRow(r, reviewerMap, tierMap)));
      res.json(paginatedResponse(rows, total, pg));
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/reviews',
    requireAuth,
    requireVerifiedEmail,
    validate({ body: reviewCreateSchema }),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof reviewCreateSchema>;
        const sanitizedComment = sanitizeUserGeneratedText(body.comment).trim();
        if (sanitizedComment.length < 10) {
          throw new ApiError(400, 'invalid_comment_content', 'Comment cannot contain only links or phone numbers.');
        }
        const domainType = reviewTargetWireToEnum(body.targetType);
        if (domainType === ReviewTargetType.ACTIVITY) {
          await assertViewerCanReviewActivity(req.auth!.userId, body.targetId);
        }
        const review = await createSocialReview({
          targetType: domainType,
          targetId: body.targetId,
          userId: req.auth!.userId,
          rating: body.rating,
          comment: sanitizedComment,
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
            createdAt: review.createdAt.toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
};
