import { PostCategory, ReviewTargetType, RewardAction } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { awardPointsDefault } from '../services/rewards.js';
import { tierEnumToDisplay } from '../lib/rewards-config.js';
import { findAuthUserById, findAuthUsersByIds, getAuthUserMembershipTier } from '../lib/auth-users.js';
import { createUserFavorite, deleteUserFavoriteById, findUserFavorite, listUserFavoritesWithDetails } from '../lib/favorites-store.js';
import { createSocialPost, createSocialReply, createSocialReview, getSocialPostById, listSocialPosts, listSocialReviews, toggleSocialPostLike } from '../lib/social-data.js';

type SocialAuthor = {
  _id: string;
  email: string;
  profile: { displayName?: string | null; avatarUrl?: string | null };
};

type SocialPostAuthor = {
  author: SocialAuthor | undefined;
  authorMembershipTier: string | null;
};

type AuthorWithProfile = {
  profile?: { displayName?: string | null; avatarUrl?: string | null } | null;
  email: string;
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
  eventId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: SocialAuthor;
  location?: { name: string } | null;
  replies: Array<{
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author?: SocialAuthor;
  }>;
  _count?: { likes: number; replies: number };
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
  eventId: post.eventId,
  authorId: post.authorId,
  ...buildAuthorView(authorMap.get(post.authorId), tierMap.get(post.authorId) ?? null),
  likeCount: post.likeCount ?? post._count?.likes ?? 0,
  replyCount: post.replyCount ?? post._count?.replies ?? post.replies.length,
  replies: post.replies.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    ...buildAuthorView(authorMap.get(r.authorId), tierMap.get(r.authorId) ?? null),
    content: r.content,
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
    const review = await createSocialReview({
      targetType: body.targetType === 'location' ? ReviewTargetType.LOCATION : ReviewTargetType.TENANT,
      targetId: body.targetId,
      userId: req.auth!.userId,
      rating: body.rating,
      comment: body.comment
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
  eventId: z.string().optional()
});

const replyCreateSchema = z.object({
  content: z.string().min(1).max(2000)
});

socialRouter.get('/posts', validate({ query: postListSchema }), async (req, res, next) => {
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
      replyPreviewLimit: 3
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

socialRouter.get('/posts/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const post = await getSocialPostById(id);
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
    const post = await createSocialPost({
      category: categoryMap[body.category],
      title: body.title,
      content: body.content,
      images: body.images,
      locationId: body.locationId,
      eventId: body.eventId,
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
      const post = await getSocialPostById(id);
      if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');

      const reply = await createSocialReply({ postId: id, authorId: req.auth!.userId, content });
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

// ─── Favorites (auth) ───────────────────────────────────────────────────────

const favoriteCreateSchema = z.object({
  locationId: z.string().optional(),
  eventId: z.string().optional()
}).refine((d) => d.locationId || d.eventId, { message: 'locationId or eventId required' });

socialRouter.get('/me/favorites', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const favorites = await listUserFavoritesWithDetails(req.auth!.userId);
    res.json({
      data: favorites.map((f) => ({
        id: f.id,
        locationId: f.locationId,
        eventId: f.eventId,
        createdAt: f.createdAt.toISOString(),
        location: f.location ? { id: f.location.id, name: f.location.name, images: f.location.images } : null,
        event: f.event ? { id: f.event.id, title: f.event.title, locationName: f.event.locationName } : null
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
      eventId: body.eventId
    });
    res.status(201).json({
      data: {
        id: favorite.id,
        locationId: favorite.locationId,
        eventId: favorite.eventId,
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
    const eventId = req.query.eventId as string | undefined;
    const favorite = await findUserFavorite({
      userId: req.auth!.userId,
      locationId,
      eventId
    });
    res.json({ data: { saved: Boolean(favorite), favoriteId: favorite?.id ?? null } });
  } catch (error) {
    next(error);
  }
});
