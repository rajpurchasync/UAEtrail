import type { Router } from 'express';
import { z } from 'zod';
import { paginatedResponse, paginationSchema } from '../../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sanitizeUserGeneratedText } from '../../lib/content-moderation.js';
import { ApiError } from '../../lib/api-error.js';
import { listMyReviews, updateMyReview } from '../../services/my-reviews.js';
import { createMemberReview } from '../../services/review-commands.js';
import { listMarketingReviewHighlights, listPublicReviews } from '../../services/review-read.js';

const idParamSchema = z.object({ id: z.string().min(1) });

const reviewTargetWireSchema = z.enum(['location', 'tenant', 'activity', 'user']);

const reviewListSchema = paginationSchema.extend({
  targetType: reviewTargetWireSchema,
  targetId: z.string().min(1),
});

const reviewCreateSchema = z.object({
  targetType: reviewTargetWireSchema,
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  /** Outing that proves the reviewer went. Required for a person. Optional for an operator profile. */
  activityId: z.string().min(1).optional(),
});

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

const marketingHighlightsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(8).default(4),
});

/** Place, host/shop, and activity reviews (`social_reviews`). */
export const registerReviewRoutes = (router: Router): void => {
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

  router.get(
    '/reviews/marketing-highlights',
    validate({ query: marketingHighlightsSchema }),
    async (req, res, next) => {
      try {
        const { limit } = req.query as unknown as z.infer<typeof marketingHighlightsSchema>;
        const data = await listMarketingReviewHighlights(limit);
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
      const { items, total } = await listPublicReviews({
        targetType,
        targetId,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      res.json(paginatedResponse(items, total, { page, pageSize }));
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
        const data = await createMemberReview({
          userId: req.auth!.userId,
          targetType: body.targetType,
          targetId: body.targetId,
          rating: body.rating,
          comment: body.comment,
          activityId: body.activityId,
        });
        res.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    }
  );
};
