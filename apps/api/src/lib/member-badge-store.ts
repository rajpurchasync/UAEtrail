import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import type { RewardAction } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';
import { isDuplicateKeyError } from './mongo-errors.js';

type MongoMemberActionLog = {
  _id: string;
  userId: string;
  action: RewardAction;
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

const memberActionLogCollection = (): Collection<MongoMemberActionLog> =>
  getMongoClient()!.db().collection<MongoMemberActionLog>('reward_ledgers');

const userBadgesCollection = (): Collection<MongoUserBadge> =>
  getMongoClient()!.db().collection<MongoUserBadge>('user_badges');

export const countMemberActions = async (userId: string, action: RewardAction): Promise<number> =>
  memberActionLogCollection().countDocuments({ userId, action });

export const hasMemberAction = async (userId: string, action: RewardAction): Promise<boolean> => {
  const entry = await memberActionLogCollection().findOne({ userId, action }, { projection: { _id: 1 } });
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
      createdAt,
    });
    return { id, badgeKey: input.badgeKey };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }
    throw error;
  }
};

/** Idempotent action log for badge progress (legacy collection name retained). */
export const recordMemberActionLog = async (input: {
  userId: string;
  action: RewardAction;
  referenceId: string;
  label: string;
  meta?: unknown;
}): Promise<{ id: string } | null> => {
  const id = randomUUID();
  const createdAt = new Date();

  try {
    await memberActionLogCollection().insertOne({
      _id: id,
      userId: input.userId,
      action: input.action,
      referenceId: input.referenceId,
      label: input.label,
      meta: input.meta ?? null,
      createdAt,
    });
    return { id };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }
    throw error;
  }
};
