import {
  isFacilityPlaceKind,
  placeKindFromLocationRow,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { LocationStatus, ReviewTargetType, TenantBusinessMode, TenantStatus } from '../domain/enums.js';
import { findAuthUserByEmail } from './auth-users-store.js';
import { getMongoClient } from './mongo.js';
import { createSocialReview } from './social-reviews-store.js';

export type SeedPlaceReviewDraft = {
  userIndex: number;
  rating: number;
  comment: string;
};

const PLACE_COMMENTS = [
  'Easy parking and a clear trail — perfect weekend outing with friends.',
  'Beautiful scenery. Go early on Fridays for quieter paths.',
  'Brought friends who had never been here — they already want to come back.',
  'Well marked and child-friendly in the first kilometres.',
  'Great meeting spot. We will host here again.',
  'Take extra water in summer. The views are worth it.',
] as const;

const SHOP_COMMENTS = [
  'Stocked the hydration and snacks we needed before the trail.',
  'Helpful staff and decent weekend hours.',
  'Grabbed missing camp kit here — saved the drive back to town.',
] as const;

/** Keep the two long-standing demo reviews when those places are seeded. */
const FEATURED_LOCATION_REVIEWS: Record<string, SeedPlaceReviewDraft> = {
  'wadi-shawka-loop': {
    userIndex: 0,
    rating: 5,
    comment: 'Beautiful wadi with easy access. Perfect for a morning hike with friends.',
  },
  'jebel-jais-summit-trail': {
    userIndex: 2,
    rating: 4,
    comment: 'Challenging but rewarding summit trail. Start early and bring layers for the summit.',
  },
};

const REVIEWER_EMAILS = [
  'visitor@uaetrails.app',
  'visitor2@uaetrails.app',
  'guide@uaetrails.app',
  'host@uaetrails.app',
  'organizer@uaetrails.app',
] as const;

const stableHash = (value: string): number => {
  let hash = 7;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const ratingSetForHash = (hash: number): [number, number, number] => {
  const sets: Array<[number, number, number]> = [
    [5, 5, 4],
    [5, 4, 4],
    [5, 5, 5],
    [5, 4, 5],
  ];
  return sets[hash % sets.length] ?? [5, 4, 5];
};

/** Three deterministic reviews so every catalog place shows a scored overlay. */
export const catalogPlaceReviewDraftsForId = (
  targetId: string,
  kind: PlaceKind | 'tenant-shop' = 'hiking'
): SeedPlaceReviewDraft[] => {
  const hash = stableHash(targetId);
  const ratings = ratingSetForHash(hash);
  const comments = kind === 'shop' || kind === 'tenant-shop' ? SHOP_COMMENTS : PLACE_COMMENTS;
  const featured = kind === 'tenant-shop' ? undefined : FEATURED_LOCATION_REVIEWS[targetId];
  const drafts: SeedPlaceReviewDraft[] = [];
  const usedUsers = new Set<number>();

  if (featured) {
    drafts.push(featured);
    usedUsers.add(featured.userIndex);
  }

  for (let slot = 0; drafts.length < 3 && slot < 12; slot += 1) {
    const userIndex = (hash + slot) % REVIEWER_EMAILS.length;
    if (usedUsers.has(userIndex)) continue;
    usedUsers.add(userIndex);
    const comment = comments[(hash + slot) % comments.length] ?? comments[0];
    drafts.push({ userIndex, rating: ratings[drafts.length] ?? 5, comment });
  }

  return drafts.slice(0, 3);
};

const upsertReview = async (input: {
  userId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string;
}): Promise<'inserted' | 'updated'> => {
  const collection = getMongoClient()!.db().collection('social_reviews');
  const existing = await collection.findOne({
    userId: input.userId,
    targetType: input.targetType,
    targetId: input.targetId,
  });
  if (existing) {
    await collection.updateOne(
      { _id: existing._id },
      { $set: { rating: input.rating, comment: input.comment } }
    );
    return 'updated';
  }
  await createSocialReview(input);
  return 'inserted';
};

export type SeedCatalogPlaceReviewsResult = {
  places: number;
  shops: number;
  inserted: number;
  updated: number;
  skipped: boolean;
};

const applyDrafts = async (
  targetType: ReviewTargetType,
  targetId: string,
  kind: PlaceKind | 'tenant-shop',
  reviewerIds: string[]
): Promise<{ inserted: number; updated: number }> => {
  let inserted = 0;
  let updated = 0;
  for (const draft of catalogPlaceReviewDraftsForId(targetId, kind)) {
    const userId = reviewerIds[draft.userIndex];
    if (!userId) continue;
    const result = await upsertReview({
      userId,
      targetType,
      targetId,
      rating: draft.rating,
      comment: draft.comment,
    });
    if (result === 'inserted') inserted += 1;
    else updated += 1;
  }
  return { inserted, updated };
};

/** Idempotent — fills LOCATION + shop TENANT ratings so venue list chips are scored. */
export const seedCatalogPlaceReviews = async (): Promise<SeedCatalogPlaceReviewsResult> => {
  const reviewers = await Promise.all(REVIEWER_EMAILS.map((email) => findAuthUserByEmail(email)));
  const reviewerIds = reviewers.map((user) => user?._id ?? null);
  if (reviewerIds.some((id) => !id)) {
    console.warn('[seed] catalog place reviews skipped — run full seed first (missing demo users)');
    return { places: 0, shops: 0, inserted: 0, updated: 0, skipped: true };
  }
  const ids = reviewerIds as string[];
  const db = getMongoClient()!.db();

  const locations = await db
    .collection<{ _id: string; activityType?: string; tags?: string[]; status?: string }>(
      'locations'
    )
    .find({ status: LocationStatus.ACTIVE })
    .project({ _id: 1, activityType: 1, tags: 1, status: 1 })
    .toArray();

  let places = 0;
  let inserted = 0;
  let updated = 0;

  for (const location of locations) {
    const kind = placeKindFromLocationRow({
      activityType: location.activityType ?? 'hiking',
      tags: location.tags ?? [],
    });
    if (isFacilityPlaceKind(kind)) continue;
    places += 1;
    const result = await applyDrafts(ReviewTargetType.LOCATION, location._id, kind, ids);
    inserted += result.inserted;
    updated += result.updated;
  }

  const shops = await db
    .collection<{ _id: string }>('tenants')
    .find({ businessMode: TenantBusinessMode.SHOP, status: TenantStatus.ACTIVE })
    .project({ _id: 1 })
    .toArray();

  for (const shop of shops) {
    const result = await applyDrafts(ReviewTargetType.TENANT, shop._id, 'tenant-shop', ids);
    inserted += result.inserted;
    updated += result.updated;
  }

  return { places, shops: shops.length, inserted, updated, skipped: false };
};
