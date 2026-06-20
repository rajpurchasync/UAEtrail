import { PostCategory, ReviewTargetType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { paginate, paginatedResponse, paginationSchema } from '../lib/pagination.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

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
  author: { profile?: { displayName?: string | null; avatarUrl?: string | null } | null; email: string };
  location?: { name: string } | null;
  replies: Array<{
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
    author: { profile?: { displayName?: string | null; avatarUrl?: string | null } | null; email: string };
  }>;
  _count?: { likes: number; replies: number };
  likeCount?: number;
  replyCount?: number;
}) => ({
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
  authorName: post.author.profile?.displayName ?? post.author.email.split('@')[0],
  authorAvatar: post.author.profile?.avatarUrl ?? null,
  likeCount: post.likeCount ?? post._count?.likes ?? 0,
  replyCount: post.replyCount ?? post._count?.replies ?? post.replies.length,
  replies: post.replies.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    authorName: r.author.profile?.displayName ?? r.author.email.split('@')[0],
    authorAvatar: r.author.profile?.avatarUrl ?? null,
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
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: { user: { include: { profile: true } } }
      }),
      prisma.review.count({ where })
    ]);
    res.json(
      paginatedResponse(
        reviews.map((r) => ({
          id: r.id,
          targetType: r.targetType === ReviewTargetType.LOCATION ? 'location' : 'tenant',
          targetId: r.targetId,
          userId: r.userId,
          userName: r.user.profile?.displayName ?? r.user.email.split('@')[0],
          userAvatar: r.user.profile?.avatarUrl ?? null,
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
    const review = await prisma.review.create({
      data: {
        targetType: body.targetType === 'location' ? ReviewTargetType.LOCATION : ReviewTargetType.TENANT,
        targetId: body.targetId,
        userId: req.auth!.userId,
        rating: body.rating,
        comment: body.comment
      },
      include: { user: { include: { profile: true } } }
    });
    res.status(201).json({
      data: {
        id: review.id,
        targetType: body.targetType,
        targetId: review.targetId,
        userId: review.userId,
        userName: review.user.profile?.displayName ?? review.user.email.split('@')[0],
        userAvatar: review.user.profile?.avatarUrl ?? null,
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
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pg),
        include: {
          author: { include: { profile: true } },
          location: { select: { name: true } },
          replies: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: { author: { include: { profile: true } } }
          },
          _count: { select: { likes: true, replies: true } }
        }
      }),
      prisma.post.count({ where })
    ]);
    res.json(paginatedResponse(posts.map(mapPost), total, pg));
  } catch (error) {
    next(error);
  }
});

socialRouter.get('/posts/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        location: { select: { name: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { include: { profile: true } } }
        },
        _count: { select: { likes: true, replies: true } }
      }
    });
    if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');
    res.json({ data: mapPost(post) });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/posts', requireAuth, requireVerifiedEmail, validate({ body: postCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof postCreateSchema>;
    const post = await prisma.post.create({
      data: {
        category: categoryMap[body.category],
        title: body.title,
        content: body.content,
        images: body.images,
        locationId: body.locationId,
        eventId: body.eventId,
        authorId: req.auth!.userId
      },
      include: {
        author: { include: { profile: true } },
        location: { select: { name: true } },
        replies: { include: { author: { include: { profile: true } } } },
        _count: { select: { likes: true, replies: true } }
      }
    });
    res.status(201).json({ data: mapPost(post) });
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
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) throw new ApiError(404, 'post_not_found', 'Post not found.');

      const reply = await prisma.postReply.create({
        data: { postId: id, authorId: req.auth!.userId, content },
        include: { author: { include: { profile: true } } }
      });
      res.status(201).json({
        data: {
          id: reply.id,
          authorId: reply.authorId,
          authorName: reply.author.profile?.displayName ?? reply.author.email.split('@')[0],
          authorAvatar: reply.author.profile?.avatarUrl ?? null,
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
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId } }
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      res.json({ data: { liked: false } });
      return;
    }
    await prisma.postLike.create({ data: { postId: id, userId } });
    res.json({ data: { liked: true } });
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
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        event: { include: { location: true } }
      }
    });
    res.json({
      data: favorites.map((f) => ({
        id: f.id,
        locationId: f.locationId,
        eventId: f.eventId,
        createdAt: f.createdAt.toISOString(),
        location: f.location ? { id: f.location.id, name: f.location.name, images: f.location.images } : null,
        event: f.event ? { id: f.event.id, title: f.event.title, locationName: f.event.location.name } : null
      }))
    });
  } catch (error) {
    next(error);
  }
});

socialRouter.post('/me/favorites', requireAuth, requireVerifiedEmail, validate({ body: favoriteCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof favoriteCreateSchema>;
    const favorite = await prisma.userFavorite.create({
      data: {
        userId: req.auth!.userId,
        locationId: body.locationId,
        eventId: body.eventId
      }
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
    await prisma.userFavorite.deleteMany({
      where: { id, userId: req.auth!.userId }
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

socialRouter.get('/me/favorites/check', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const locationId = req.query.locationId as string | undefined;
    const eventId = req.query.eventId as string | undefined;
    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId: req.auth!.userId,
        ...(locationId ? { locationId } : {}),
        ...(eventId ? { eventId } : {})
      }
    });
    res.json({ data: { saved: Boolean(favorite), favoriteId: favorite?.id ?? null } });
  } catch (error) {
    next(error);
  }
});
