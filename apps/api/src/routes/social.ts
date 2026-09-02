import { PostCategory, ReviewTargetType, RewardAction } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { validate } from '../middleware/validate.js';
import { awardPointsDefault } from '../services/rewards.js';
import { tierEnumToDisplay } from '../lib/rewards-config.js';
import { findAuthUserById, findAuthUsersByIds, getAuthUserMembershipTier } from '../lib/auth-users.js';
import { createUserFavorite, deleteUserFavoriteById, findUserFavorite, listUserFavoritesWithDetails } from '../lib/favorites-store.js';
import { createSocialPost, createSocialReply, createSocialReview, getSocialPostById, listSocialPosts, listSocialReviews, setAcceptedSocialReply, toggleSocialPostLike, toggleSocialReplyLike } from '../lib/social-data.js';
import { sanitizeUserGeneratedText } from '../lib/content-moderation.js';

type SocialAuthor = {
  _id: string;
  email: string;
  profile: { displayName?: string | null; avatarUrl?: string | null };
};

export const socialRouter = Router();

const idParamSchema = z.object({ id: z.string().min(1) });

const categoryMap: Record<string, PostCategory> = {
  questions: PostCategory.QUESTIONS,
  'trip-reports': PostCategory.TRIP_REPORTS,
  photos: PostCategory.PHOTOS,
  tips: PostCategory.TIPS
};

const categoryFromDb = (cat: PostCategory): string => {
  const entry = Object.entries(categoryMap).find(([, v]) => v === cat);
  return entry?.[0] ?? 'questions';
};

const buildAuthorView = (author: SocialAuthor | undefined, membershipTier: string | null) => ({
  authorName: author?.profile.displayName ?? author?.email.split('@')[0] ?? 'Unknown',
  authorAvatar: author?.profile.avatarUrl ?? null,
  authorMembershipTier: tierEnumToDisplay(membershipTier)
});

const enrichPostAuthors = async <T extends { authorId: string; replies: Array<{ authorId: string }> }>(post: T) => {
  const authorIds = [...new Set([post.authorId, ...post.replies.map((reply) => reply.authorId)])];
  const authors = await findAuthUsersByIds(authorIds);
  const authorMap = new Map(authors.map((author) => [author._id, author]));
  const tierEntries = await Promise.all(
    authorIds.map(async (userId) => [userId, await getAuthUserMembershipTier(userId)] as const)
  );
  const tierMap = new Map(tierEntries);
  return { authorMap, tierMap };
};

const mapPost = (post: {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  locationId: string | null;
  activityId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: SocialAuthor;
  location?: { name: string } | null;
  replies: Array<{
    id: string;
    authorId: string;
    content: string;
    likedByMe: boolean;
    likeCount: number;
    isAccepted: boolean;
    createdAt: Date;
    author?: SocialAuthor;
  }>;
  _count?: { likes: number; replies: number };
  likedByMe?: boolean;
  likeCount?: number;
  replyCount?: number;
}, authorMap: Map<string, SocialAuthor>, tierMap: Map<string, string | null>) => ({
  id: post.id,
  category: categoryFromDb(post.category),
  title: post.title,
  content: post.content,
  excerpt: post.content.slice(0, 160),
  images: post.images,
  locationId: post.locationId,
  locationName: post.location?.name ?? null,
  activityId: post.activityId,
  authorId: post.authorId,
  ...buildAuthorView(authorMap.get(post.authorId), tierMap.get(post.authorId) ?? null),
  likedByMe: post.likedByMe ?? false,
  likeCount: post.likeCount ?? post._count?.likes ?? 0,
  replyCount: post.replyCount ?? post._count?.replies ?? post.replies.length,
  acceptedReplyId: 'acceptedReplyId' in post ? (post.acceptedReplyId ?? null) : null,
  replies: post.replies.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    ...buildAuthorView(authorMap.get(r.authorId), tierMap.get(r.authorId) ?? null),
    content: r.content,
    likedByMe: r.likedByMe,
    likeCount: r.likeCount,
    isAccepted: r.isAccepted,
    createdAt: r.createdAt.toISOString()
  })),
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString()
});

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
    void awardPointsDefault({
      userId: req.auth!.userId,
      action: RewardAction.REVIEW_WRITTEN,
      referenceId: review.id
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

// ─── Community Posts ────────────────────────────────────────────────────────

const postListSchema = paginationSchema.extend({
  category: z.enum(['questions', 'trip-reports', 'photos', 'tips', 'all']).default('all'),
  locationId: z.string().optional(),
  search: z.string().optional()
});

const postCreateSchema = z.object({
  category: z.enum(['questions', 'trip-reports', 'photos', 'tips']),
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  images: z.array(z.string()).max(6).default([]),
  locationId: z.string().optional(),
  activityId: z.string().optional()
});

const replyCreateSchema = z.object({
  content: z.string().min(1).max(2000)
});

const replyIdParamSchema = z.object({
  id: z.string().min(1),
  replyId: z.string().min(1)
});

socialRouter.get('/posts', optionalAuth, validate({ query: postListSchema }), async (req, res, next) => {
  try {
    const { category, locationId, search, page, pageSize } = req.query as unknown as z.infer<typeof postListSchema>;
    const pg = { page, pageSize };
    const where = {
      ...(category !== 'all' ? { category: categoryMap[category] } : {}),
      ...(locationId ? { locationId } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } }] } : {})
    };
    const { items: posts, total } = await listSocialPosts({
      category: where.category,
      locationId,
      search,
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
      replyPreviewLimit: 3,
      currentUserId: req.auth?.userId
    });

    const authorIds = [...new Set(posts.flatMap((post) => [post.authorId, ...post.replies.map((reply) => reply.authorId)]))];
    const authors = await findAuthUsersByIds(authorIds);
    const authorMap = new Map(authors.map((author) => [author._id, author]));
    const tierEntries = await Promise.all(authorIds.map(async (userId) => [userId, await getAuthUserMembershipTier(userId)] as const));
    const tierMap = new Map(tierEntries);
    res.json(paginatedResponse(posts.map((post) => mapPost(post, authorMap, tierMap)), total, pg));
  } catch (error) {
    next(error);
  }
});

socialRouter.get('/posts/:id', optionalAuth, validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const post = await getSocialPostById(id, req.auth?.userId);
    if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');
    const { authorMap, tierMap } = await enrichPostAuthors(post);
    res.json({ data: mapPost(post, authorMap, tierMap) });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/posts', requireAuth, requireVerifiedEmail, validate({ body: postCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof postCreateSchema>;
    const sanitizedContent = sanitizeUserGeneratedText(body.content).trim();
    if (sanitizedContent.length < 10) {
      throw new ApiError(400, 'invalid_post_content', 'Post message cannot contain only links or phone numbers.');
    }
    const post = await createSocialPost({
      category: categoryMap[body.category],
      title: body.title,
      content: sanitizedContent,
      images: body.images,
      locationId: body.locationId,
      activityId: body.activityId,
      authorId: req.auth!.userId
    });
    void awardPointsDefault({
      userId: req.auth!.userId,
      action: RewardAction.COMMUNITY_POST,
      referenceId: post.id
    }).catch(() => undefined);
    const { authorMap, tierMap } = await enrichPostAuthors(post);
    res.status(201).json({ data: mapPost(post, authorMap, tierMap) });
  } catch (error) {
    next(error);
  }
});

socialRouter.post(
  '/posts/:id/replies',
  requireAuth,
  requireVerifiedEmail,
  validate({ params: idParamSchema, body: replyCreateSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as z.infer<typeof idParamSchema>;
      const { content } = req.body as z.infer<typeof replyCreateSchema>;
      const post = await getSocialPostById(id, req.auth?.userId);
      if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');

      const sanitizedReply = sanitizeUserGeneratedText(content).trim();
      if (!sanitizedReply) {
        throw new ApiError(400, 'invalid_reply_content', 'Comment cannot contain only links or phone numbers.');
      }

      const reply = await createSocialReply({ postId: id, authorId: req.auth!.userId, content: sanitizedReply });
      void awardPointsDefault({
        userId: req.auth!.userId,
        action: RewardAction.COMMUNITY_REPLY,
        referenceId: reply.id
      }).catch(() => undefined);
      const author = await findAuthUserById(req.auth!.userId);
      const authorMembershipTier = await getAuthUserMembershipTier(req.auth!.userId);
      res.status(201).json({
        data: {
          id: reply.id,
          authorId: reply.authorId,
          authorName: author?.profile.displayName ?? author?.email.split('@')[0],
          authorAvatar: author?.profile.avatarUrl ?? null,
          authorMembershipTier: tierEnumToDisplay(authorMembershipTier),
          content: reply.content,
          likedByMe: false,
          likeCount: 0,
          isAccepted: false,
          createdAt: reply.createdAt.toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

socialRouter.post('/posts/:id/like', requireAuth, requireVerifiedEmail, validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const userId = req.auth!.userId;
    const result = await toggleSocialPostLike({ postId: id, userId });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/posts/:id/replies/:replyId/like', requireAuth, requireVerifiedEmail, validate({ params: replyIdParamSchema }), async (req, res, next) => {
  try {
    const { id, replyId } = req.params as z.infer<typeof replyIdParamSchema>;
    const userId = req.auth!.userId;
    const post = await getSocialPostById(id, userId);
    if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');
    const reply = post.replies.find((item) => item.id === replyId);
    if (!reply) throw new ApiError(404, 'reply_not_found', 'Comment not found.');
    const result = await toggleSocialReplyLike({ postId: id, replyId, userId });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/posts/:id/replies/:replyId/accept', requireAuth, requireVerifiedEmail, validate({ params: replyIdParamSchema }), async (req, res, next) => {
  try {
    const { id, replyId } = req.params as z.infer<typeof replyIdParamSchema>;
    const userId = req.auth!.userId;
    const post = await getSocialPostById(id, userId);
    if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');
    if (post.authorId !== userId) {
      throw new ApiError(403, 'forbidden', 'Only the post author can accept a reply.');
    }
    const reply = post.replies.find((item) => item.id === replyId);
    if (!reply) throw new ApiError(404, 'reply_not_found', 'Comment not found.');
    await setAcceptedSocialReply({ postId: id, replyId: post.acceptedReplyId === replyId ? null : replyId });
    const updated = await getSocialPostById(id, userId);
    if (!updated) throw new ApiError(404, 'post_not_found', 'Post not found.');
    const { authorMap, tierMap } = await enrichPostAuthors(updated);
    res.json({ data: mapPost(updated, authorMap, tierMap) });
  } catch (error) {
    next(error);
  }
});

// ─── Favorites (auth) ───────────────────────────────────────────────────────

const favoriteCreateSchema = z.object({
  locationId: z.string().optional(),
  activityId: z.string().optional(),
  productId: z.string().optional()
}).refine(
  (d) => [d.locationId, d.activityId, d.productId].filter(Boolean).length === 1,
  { message: 'Exactly one of locationId, activityId, or productId is required.' }
);

socialRouter.get('/me/favorites', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const favorites = await listUserFavoritesWithDetails(req.auth!.userId);
    res.json({
      data: favorites.map((f) => ({
        id: f.id,
        locationId: f.locationId,
        activityId: f.activityId,
        productId: f.productId,
        createdAt: f.createdAt.toISOString(),
        location: f.location ? { id: f.location.id, name: f.location.name, images: f.location.images } : null,
        activity: f.activity ? { id: f.activity.id, title: f.activity.title, locationName: f.activity.locationName } : null,
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
      productId: body.productId
    });
    res.status(201).json({
      data: {
        id: favorite.id,
        locationId: favorite.locationId,
        activityId: favorite.activityId,
        productId: favorite.productId,
        createdAt: favorite.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

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
    const productId = req.query.productId as string | undefined;
    const favorite = await findUserFavorite({
      userId: req.auth!.userId,
      locationId,
      activityId,
      productId
    });
    res.json({ data: { saved: Boolean(favorite), favoriteId: favorite?.id ?? null } });
  } catch (error) {
    next(error);
  }
});
