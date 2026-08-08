import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { PostCategory, ReviewTargetType } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';

export type SocialReview = {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type SocialReply = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likedByMe: boolean;
  likeCount: number;
  isAccepted: boolean;
  createdAt: Date;
};

type MongoReplyLike = {
  _id: string;
  postId: string;
  replyId: string;
  userId: string;
  createdAt: Date;
};

export type SocialPost = {
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
  replies: SocialReply[];
  likedByMe: boolean;
  likeCount: number;
  replyCount: number;
  acceptedReplyId: string | null;
};

type MongoReview = {
  _id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

type MongoPost = {
  _id: string;
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  locationId: string | null;
  eventId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedReplyId: string | null;
};

type MongoReply = {
  _id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

type MongoLike = {
  _id: string;
  postId: string;
  userId: string;
  createdAt: Date;
};

const reviewsCollection = (): Collection<MongoReview> =>
  getMongoClient()!.db().collection<MongoReview>('social_reviews');

const postsCollection = (): Collection<MongoPost> =>
  getMongoClient()!.db().collection<MongoPost>('social_posts');

const repliesCollection = (): Collection<MongoReply> =>
  getMongoClient()!.db().collection<MongoReply>('social_post_replies');

const likesCollection = (): Collection<MongoLike> =>
  getMongoClient()!.db().collection<MongoLike>('social_post_likes');

const replyLikesCollection = (): Collection<MongoReplyLike> =>
  getMongoClient()!.db().collection<MongoReplyLike>('social_post_reply_likes');

const mapReview = (review: MongoReview): SocialReview => ({
  id: review._id,
  targetType: review.targetType,
  targetId: review.targetId,
  userId: review.userId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt
});

const mapReply = (reply: MongoReply): SocialReply => ({
  id: reply._id,
  postId: reply.postId,
  authorId: reply.authorId,
  content: reply.content,
  likedByMe: false,
  likeCount: 0,
  isAccepted: false,
  createdAt: reply.createdAt
});

const buildPostsWithStats = async (
  posts: MongoPost[],
  replyPreviewLimit?: number,
  currentUserId?: string
): Promise<SocialPost[]> => {
  if (posts.length === 0) return [];

  const ids = posts.map((p) => p._id);
  const [allReplies, allLikes, allReplyLikes] = await Promise.all([
    repliesCollection().find({ postId: { $in: ids } }).sort({ createdAt: 1 }).toArray(),
    likesCollection().find({ postId: { $in: ids } }).toArray(),
    replyLikesCollection().find({ postId: { $in: ids } }).toArray()
  ]);

  const repliesByPost = new Map<string, MongoReply[]>();
  for (const reply of allReplies) {
    const existing = repliesByPost.get(reply.postId) ?? [];
    existing.push(reply);
    repliesByPost.set(reply.postId, existing);
  }

  const likeCountByPost = new Map<string, number>();
  const likedByCurrentUser = new Set<string>();
  for (const like of allLikes) {
    likeCountByPost.set(like.postId, (likeCountByPost.get(like.postId) ?? 0) + 1);
    if (currentUserId && like.userId === currentUserId) {
      likedByCurrentUser.add(like.postId);
    }
  }

  const replyLikeCountByReply = new Map<string, number>();
  const replyLikedByCurrentUser = new Set<string>();
  for (const like of allReplyLikes) {
    replyLikeCountByReply.set(like.replyId, (replyLikeCountByReply.get(like.replyId) ?? 0) + 1);
    if (currentUserId && like.userId === currentUserId) {
      replyLikedByCurrentUser.add(like.replyId);
    }
  }

  return posts.map((post) => {
    const replies = repliesByPost.get(post._id) ?? [];
    return {
      id: post._id,
      category: post.category,
      title: post.title,
      content: post.content,
      images: post.images,
      locationId: post.locationId,
      eventId: post.eventId,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      replies: replies.slice(0, replyPreviewLimit ?? replies.length).map((reply) => ({
        ...mapReply(reply),
        likedByMe: replyLikedByCurrentUser.has(reply._id),
        likeCount: replyLikeCountByReply.get(reply._id) ?? 0,
        isAccepted: post.acceptedReplyId === reply._id
      })),
      likedByMe: likedByCurrentUser.has(post._id),
      likeCount: likeCountByPost.get(post._id) ?? 0,
      replyCount: replies.length,
      acceptedReplyId: post.acceptedReplyId
    };
  });
};

export const listSocialReviews = async (input: {
  targetType: ReviewTargetType;
  targetId: string;
  skip: number;
  take: number;
}): Promise<{ items: SocialReview[]; total: number }> => {
  const query = { targetType: input.targetType, targetId: input.targetId };
  const [items, total] = await Promise.all([
    reviewsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    reviewsCollection().countDocuments(query)
  ]);
  return { items: items.map(mapReview), total };
};

export const createSocialReview = async (input: {
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<SocialReview> => {
  const doc: MongoReview = {
    _id: randomUUID(),
    targetType: input.targetType,
    targetId: input.targetId,
    userId: input.userId,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date()
  };
  await reviewsCollection().insertOne(doc);
  return mapReview(doc);
};

export const listSocialPosts = async (input: {
  category?: PostCategory;
  locationId?: string;
  search?: string;
  skip: number;
  take: number;
  replyPreviewLimit: number;
  currentUserId?: string;
}): Promise<{ items: SocialPost[]; total: number }> => {
  const query: Record<string, unknown> = {};
  if (input.category) query.category = input.category;
  if (input.locationId) query.locationId = input.locationId;
  if (input.search) {
    query.$or = [
      { title: { $regex: input.search, $options: 'i' } },
      { content: { $regex: input.search, $options: 'i' } }
    ];
  }

  const [posts, total] = await Promise.all([
    postsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    postsCollection().countDocuments(query)
  ]);

  const items = await buildPostsWithStats(posts, input.replyPreviewLimit, input.currentUserId);
  return { items, total };
};

export const getSocialPostById = async (id: string, currentUserId?: string): Promise<SocialPost | null> => {
  const post = await postsCollection().findOne({ _id: id });
  if (!post) return null;
  const [items] = await Promise.all([buildPostsWithStats([post], undefined, currentUserId)]);
  return items[0] ?? null;
};

export const createSocialPost = async (input: {
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  locationId?: string;
  eventId?: string;
  authorId: string;
}): Promise<SocialPost> => {
  const now = new Date();
  const post: MongoPost = {
    _id: randomUUID(),
    category: input.category,
    title: input.title,
    content: input.content,
    images: input.images,
    locationId: input.locationId ?? null,
    eventId: input.eventId ?? null,
    authorId: input.authorId,
    createdAt: now,
    updatedAt: now,
    acceptedReplyId: null
  };
  await postsCollection().insertOne(post);
  return {
    id: post._id,
    category: post.category,
    title: post.title,
    content: post.content,
    images: post.images,
    locationId: post.locationId,
    eventId: post.eventId,
    authorId: post.authorId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    replies: [],
    likedByMe: false,
    likeCount: 0,
    replyCount: 0,
    acceptedReplyId: null
  };
};

export const createSocialReply = async (input: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<SocialReply> => {
  const reply: MongoReply = {
    _id: randomUUID(),
    postId: input.postId,
    authorId: input.authorId,
    content: input.content,
    createdAt: new Date()
  };
  await repliesCollection().insertOne(reply);
  return {
    ...mapReply(reply),
    likedByMe: false,
    likeCount: 0,
    isAccepted: false
  };
};

export const toggleSocialReplyLike = async (input: {
  postId: string;
  replyId: string;
  userId: string;
}): Promise<{ liked: boolean }> => {
  const existing = await replyLikesCollection().findOne({ postId: input.postId, replyId: input.replyId, userId: input.userId });
  if (existing) {
    await replyLikesCollection().deleteOne({ _id: existing._id });
    return { liked: false };
  }

  await replyLikesCollection().insertOne({
    _id: randomUUID(),
    postId: input.postId,
    replyId: input.replyId,
    userId: input.userId,
    createdAt: new Date()
  });
  return { liked: true };
};

export const setAcceptedSocialReply = async (input: {
  postId: string;
  replyId: string | null;
}): Promise<void> => {
  await postsCollection().updateOne(
    { _id: input.postId },
    { $set: { acceptedReplyId: input.replyId } }
  );
};

export const toggleSocialPostLike = async (input: {
  postId: string;
  userId: string;
}): Promise<{ liked: boolean }> => {
  const existing = await likesCollection().findOne({ postId: input.postId, userId: input.userId });
  if (existing) {
    await likesCollection().deleteOne({ _id: existing._id });
    return { liked: false };
  }

  await likesCollection().insertOne({
    _id: randomUUID(),
    postId: input.postId,
    userId: input.userId,
    createdAt: new Date()
  });
  return { liked: true };
};

/** Delete social content authored by a user. */
export const purgeUserSocialContent = async (userId: string): Promise<void> => {
  const posts = await postsCollection().find({ authorId: userId }, { projection: { _id: 1 } }).toArray();
  const postIds = posts.map((post) => post._id);

  await likesCollection().deleteMany({ userId });
  await replyLikesCollection().deleteMany({ userId });
  await repliesCollection().deleteMany({ authorId: userId });

  if (postIds.length > 0) {
    await repliesCollection().deleteMany({ postId: { $in: postIds } });
    await likesCollection().deleteMany({ postId: { $in: postIds } });
    await replyLikesCollection().deleteMany({ postId: { $in: postIds } });
    await postsCollection().deleteMany({ authorId: userId });
  }

  await reviewsCollection().deleteMany({ userId });
};
