import type { RideshareRiderReputationDTO } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

type RatedRideshareParticipant = {
  hostRatingRideshare?: {
    cleanliness: number;
    punctuality: number;
    behaviour: number;
    payment?: number | null;
  } | null;
};

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const CACHE_MS = 60_000;
const reputationCache = new Map<string, { at: number; value: RideshareRiderReputationDTO | null }>();

const summarizeRatings = (
  ratings: NonNullable<RatedRideshareParticipant['hostRatingRideshare']>[]
): RideshareRiderReputationDTO | null => {
  if (ratings.length === 0) return null;

  const paymentScores = ratings
    .map((row) => row.payment)
    .filter((value): value is number => typeof value === 'number' && value >= 1 && value <= 5);

  const averages = {
    cleanliness: average(ratings.map((row) => row.cleanliness)),
    punctuality: average(ratings.map((row) => row.punctuality)),
    behaviour: average(ratings.map((row) => row.behaviour)),
    payment: paymentScores.length > 0 ? average(paymentScores) : null,
  };

  const overallParts = [averages.cleanliness, averages.punctuality, averages.behaviour];
  if (averages.payment != null) overallParts.push(averages.payment);

  return {
    ratingCount: ratings.length,
    overallScore: Math.round((average(overallParts) + Number.EPSILON) * 10) / 10,
    averages: {
      cleanliness: Math.round((averages.cleanliness + Number.EPSILON) * 10) / 10,
      punctuality: Math.round((averages.punctuality + Number.EPSILON) * 10) / 10,
      behaviour: Math.round((averages.behaviour + Number.EPSILON) * 10) / 10,
      payment: averages.payment != null
        ? Math.round((averages.payment + Number.EPSILON) * 10) / 10
        : null,
    },
  };
};

const readCache = (userId: string): RideshareRiderReputationDTO | null | undefined => {
  const hit = reputationCache.get(userId);
  if (!hit || Date.now() - hit.at > CACHE_MS) return undefined;
  return hit.value;
};

const writeCache = (userId: string, value: RideshareRiderReputationDTO | null): void => {
  reputationCache.set(userId, { at: Date.now(), value });
};

/** One aggregation for a join-queue page — avoids a reputation query per rider. */
export const getRideshareRiderReputations = async (
  userIds: string[]
): Promise<Map<string, RideshareRiderReputationDTO | null>> => {
  const unique = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, RideshareRiderReputationDTO | null>();
  const missing: string[] = [];
  for (const userId of unique) {
    const cached = readCache(userId);
    if (cached === undefined) missing.push(userId);
    else result.set(userId, cached);
  }
  if (missing.length === 0) return result;

  const grouped = (await getMongoClient()!
    .db()
    .collection(COLLECTIONS.ACTIVITY_PARTICIPANTS)
    .aggregate<{ _id: string; ratings: RatedRideshareParticipant['hostRatingRideshare'][] }>([
      {
        $match: {
          userId: { $in: missing },
          hostRatedAt: { $ne: null },
          hostRatingRideshare: { $exists: true },
        },
      },
      { $group: { _id: '$userId', ratings: { $push: '$hostRatingRideshare' } } },
    ])
    .toArray());

  const byUser = new Map(grouped.map((row) => [row._id, row.ratings ?? []]));
  for (const userId of missing) {
    const ratings = (byUser.get(userId) ?? []).filter(
      (row): row is NonNullable<RatedRideshareParticipant['hostRatingRideshare']> => Boolean(row)
    );
    const value = summarizeRatings(ratings);
    writeCache(userId, value);
    result.set(userId, value);
  }
  return result;
};

/** Aggregate prior host ratings for a member on rideshare outings. */
export const getRideshareRiderReputation = async (
  userId: string
): Promise<RideshareRiderReputationDTO | null> => {
  const map = await getRideshareRiderReputations([userId]);
  return map.get(userId) ?? null;
};
