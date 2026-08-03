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
  likeCount: number;
  replyCount: number;
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
  createdAt: reply.createdAt
});

const buildPostsWithStats = async (posts: MongoPost[], replyPreviewLimit?: number): Promise<SocialPost[]> => {
  if (posts.length === 0) return [];

  const ids = posts.map((p) => p._id);
  const [allReplies, allLikes] = await Promise.all([
    repliesCollection().find({ postId: { $in: ids } }).sort({ createdAt: 1 }).toArray(),
    likesCollection().find({ postId: { $in: ids } }).toArray()
  ]);

  const repliesByPost = new Map<string, MongoReply[]>();
  for (const reply of allReplies) {
    const existing = repliesByPost.get(reply.postId) ?? [];
    existing.push(reply);
    repliesByPost.set(reply.postId, existing);
  }

  const likeCountByPost = new Map<string, number>();
  for (const like of allLikes) {
    likeCountByPost.set(like.postId, (likeCountByPost.get(like.postId) ?? 0) + 1);
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
      replies: replies.slice(0, replyPreviewLimit ?? replies.length).map(mapReply),
      likeCount: likeCountByPost.get(post._id) ?? 0,
      replyCount: replies.length
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

  const items = await buildPostsWithStats(posts, input.replyPreviewLimit);
  return { items, total };
};

export const getSocialPostById = async (id: string): Promise<SocialPost | null> => {
  const post = await postsCollection().findOne({ _id: id });
  if (!post) return null;
  const [items] = await Promise.all([buildPostsWithStats([post])]);
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
    updatedAt: now
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
    likeCount: 0,
    replyCount: 0
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
  return mapReply(reply);
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
