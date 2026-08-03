import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { RewardAction } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { isDuplicateKeyError } from './mongo-errors.js';
type MongoRewardLedger = {
  _id: string;
  userId: string;
  action: RewardAction;
  points: number;
  referenceId: string;
  label: string;
  meta: unknown;
  createdAt: Date;
};

type MongoUserBadge = {
  _id: string;
  userId: string;
  badgeKey: string;
  createdAt: Date;
};

const rewardLedgerCollection = (): Collection<MongoRewardLedger> =>
  getMongoClient()!.db().collection<MongoRewardLedger>('reward_ledgers');

const userBadgesCollection = (): Collection<MongoUserBadge> =>
  getMongoClient()!.db().collection<MongoUserBadge>('user_badges');

export const countRewardLedgerEntries = async (userId: string, action: RewardAction): Promise<number> =>  rewardLedgerCollection().countDocuments({ userId, action });

export const hasRewardLedgerEntry = async (userId: string, action: RewardAction): Promise<boolean> => {
  const entry = await rewardLedgerCollection().findOne({ userId, action }, { projection: { _id: 1 } });
  return Boolean(entry);
};

export const findUserBadges = async (userId: string): Promise<Array<{ badgeKey: string; earnedAt: Date }>> => {
  const badges = await userBadgesCollection()
    .find({ userId }, { projection: { badgeKey: 1, createdAt: 1 } })
    .toArray();
  return badges.map((b) => ({ badgeKey: b.badgeKey, earnedAt: b.createdAt }));
};

export const createUserBadge = async (input: {
  userId: string;
  badgeKey: string;
}): Promise<{ id: string; badgeKey: string } | null> => {
  const id = randomUUID();
  const createdAt = new Date();

  try {
    await userBadgesCollection().insertOne({
      _id: id,
      userId: input.userId,
      badgeKey: input.badgeKey,
      createdAt
    });
    return { id, badgeKey: input.badgeKey };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }
    throw error;
  }
};

export const createRewardLedgerEntry = async (input: {
  userId: string;
  action: RewardAction;
  points: number;
  referenceId: string;
  label: string;
  meta?: unknown;
}): Promise<{ id: string }> => {
  const id = randomUUID();
  const createdAt = new Date();

  await rewardLedgerCollection().insertOne({
    _id: id,
    userId: input.userId,
    action: input.action,
    points: input.points,
    referenceId: input.referenceId,
    label: input.label,
    meta: input.meta ?? null,
    createdAt
  });

  return { id };
};
export const listUserRewardLedger = async (
  userId: string,
  limit: number = 30
): Promise<Array<{ id: string; action: RewardAction; points: number; label: string | null; createdAt: Date }>> => {
  const entries = await rewardLedgerCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return entries.map((e) => ({
    id: e._id,
    action: e.action,
    points: e.points,
    label: e.label,
    createdAt: e.createdAt
  }));
};

export const findUserRewardLedgerExport = async (
  userId: string,
  limit: number = 500
): Promise<Array<{ action: RewardAction; points: number; label: string; createdAt: Date }>> => {
  const entries = await listUserRewardLedger(userId, limit);
  return entries.map((e) => ({
    action: e.action,
    points: e.points,
    label: e.label ?? '',
    createdAt: e.createdAt
  }));
};
