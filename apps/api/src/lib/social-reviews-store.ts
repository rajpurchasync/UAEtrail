import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { ReviewTargetType } from '../domain/enums.js';
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

type MongoReview = {
  _id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

const reviewsCollection = (): Collection<MongoReview> =>
  getMongoClient()!.db().collection<MongoReview>('social_reviews');

const mapReview = (review: MongoReview): SocialReview => ({
  id: review._id,
  targetType: review.targetType,
  targetId: review.targetId,
  userId: review.userId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
});

export const listSocialReviews = async (input: {
  targetType: ReviewTargetType;
  targetId: string;
  skip: number;
  take: number;
}): Promise<{ items: SocialReview[]; total: number }> => {
  const query = { targetType: input.targetType, targetId: input.targetId };
  const [items, total] = await Promise.all([
    reviewsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    reviewsCollection().countDocuments(query),
  ]);
  return { items: items.map(mapReview), total };
};

/** Recent high-signal comments for guest marketing — not tied to a single target. */
export const listRecentMarketingSocialReviews = async (
  take: number
): Promise<SocialReview[]> => {
  const safeTake = Math.min(Math.max(take, 1), 12);
  const items = await reviewsCollection()
    .find({
      rating: { $gte: 4 },
      comment: { $type: 'string' },
    })
    .sort({ createdAt: -1 })
    .limit(safeTake * 3)
    .toArray();
  const filtered = items
    .map(mapReview)
    .filter((review) => review.comment.trim().length >= 24)
    .slice(0, safeTake);
  return filtered;
};

export const listSocialReviewsByUserId = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<{ items: SocialReview[]; total: number }> => {
  const query = { userId: input.userId };
  const [items, total] = await Promise.all([
    reviewsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    reviewsCollection().countDocuments(query),
  ]);
  return { items: items.map(mapReview), total };
};

export const updateSocialReviewForUser = async (input: {
  reviewId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<SocialReview | null> => {
  const updated = await reviewsCollection().findOneAndUpdate(
    { _id: input.reviewId, userId: input.userId },
    { $set: { rating: input.rating, comment: input.comment } },
    { returnDocument: 'after' }
  );
  return updated ? mapReview(updated) : null;
};

export type ReviewStats = {
  averageRating: number;
  reviewCount: number;
};

export const getReviewStatsByTargets = async (
  targetType: ReviewTargetType,
  targetIds: string[]
): Promise<Map<string, ReviewStats>> => {
  const uniqueIds = [...new Set(targetIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await reviewsCollection()
    .aggregate<{ _id: string; averageRating: number; reviewCount: number }>([
      { $match: { targetType, targetId: { $in: uniqueIds } } },
      {
        $group: {
          _id: '$targetId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const stats = new Map<string, ReviewStats>();
  for (const row of rows) {
    stats.set(row._id, {
      averageRating: Math.round(row.averageRating * 10) / 10,
      reviewCount: row.reviewCount,
    });
  }
  return stats;
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
    createdAt: new Date(),
  };
  await reviewsCollection().insertOne(doc);
  return mapReview(doc);
};

/** Delete social content authored by a user (reviews + legacy community posts). */
export const purgeUserSocialContent = async (userId: string): Promise<void> => {
  const db = getMongoClient()!.db();
  const posts = await db.collection('social_posts').find({ authorId: userId }, { projection: { _id: 1 } }).toArray();
  const postIds = posts.map((post) => String(post._id));

  await db.collection('social_post_likes').deleteMany({ userId });
  await db.collection('social_post_reply_likes').deleteMany({ userId });
  await db.collection('social_post_replies').deleteMany({ authorId: userId });

  if (postIds.length > 0) {
    await db.collection('social_post_replies').deleteMany({ postId: { $in: postIds } });
    await db.collection('social_post_likes').deleteMany({ postId: { $in: postIds } });
    await db.collection('social_post_reply_likes').deleteMany({ postId: { $in: postIds } });
    await db.collection('social_posts').deleteMany({ authorId: userId });
  }

  await reviewsCollection().deleteMany({ userId });
};
