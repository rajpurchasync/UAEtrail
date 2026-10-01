import { randomUUID } from 'crypto';
import type {
  MemberGoalActivityFilter,
  MemberGoalDTO,
  MemberGoalPublicDTO,
  UpsertMemberGoalInput,
} from '@uaetrail/shared-types';
import { ActivityType } from '../domain/enums.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

type MongoMemberGoal = {
  _id: string;
  userId: string;
  activityFilter: MemberGoalActivityFilter;
  targetCount: number;
  year: number;
  targetDate?: string;
  notifiedHalf?: boolean;
  notifiedComplete?: boolean;
  lastPaceNudgeAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const goalsCollection = () => getMongoClient()!.db().collection<MongoMemberGoal>(COLLECTIONS.USER_GOALS);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const endOfGoalDateUtc = (targetDate: string): Date => {
  const [y, m, d] = targetDate.split('-').map((part) => parseInt(part, 10));
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
};

export const yearFromTargetDate = (targetDate: string): number =>
  parseInt(targetDate.slice(0, 4), 10);

export const defaultTargetDateForYear = (year: number): string => `${year}-12-31`;

export const resolveGoalTargetDate = (doc: Pick<MongoMemberGoal, 'targetDate' | 'year'>): string =>
  doc.targetDate && ISO_DATE.test(doc.targetDate) ? doc.targetDate : defaultTargetDateForYear(doc.year);

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const activityTypesForFilter = (filter: MemberGoalActivityFilter): string[] => {
  if (filter === 'hiking') return [ActivityType.HIKING];
  if (filter === 'camping') return [ActivityType.CAMPING];
  return [ActivityType.HIKING, ActivityType.CAMPING, ActivityType.EVENT, ActivityType.CARPOOL];
};

/** Whether a stored activity/location type counts toward the member's goal filter. */
export const activityTypeCountsForGoal = (
  activityType: string | null | undefined,
  filter: MemberGoalActivityFilter
): boolean => {
  if (!activityType) return false;
  const normalized = activityType.toUpperCase();
  return activityTypesForFilter(filter).includes(normalized as ActivityType);
};

export const countCheckedInOutingsForGoal = async (
  userId: string,
  filter: MemberGoalActivityFilter,
  periodStart: Date,
  periodEnd: Date
): Promise<number> => {
  const types = activityTypesForFilter(filter);

  const rows = await getMongoClient()!
    .db()
    .collection(COLLECTIONS.ACTIVITY_PARTICIPANTS)
    .aggregate<{ count: number }>([
      {
        $match: {
          userId,
          checkedInAt: { $gte: periodStart, $lte: periodEnd },
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.ACTIVITIES,
          localField: 'activityId',
          foreignField: '_id',
          as: 'activity',
        },
      },
      { $unwind: '$activity' },
      {
        $lookup: {
          from: COLLECTIONS.LOCATIONS,
          localField: 'activity.locationId',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          effectiveType: { $ifNull: ['$activity.activityType', '$location.activityType'] },
        },
      },
      { $match: { effectiveType: { $in: types } } },
      { $count: 'count' },
    ])
    .toArray();

  return rows[0]?.count ?? 0;
};

const toDto = async (doc: MongoMemberGoal): Promise<MemberGoalDTO> => {
  const targetDate = resolveGoalTargetDate(doc);
  const periodStart = doc.createdAt;
  const periodEnd = endOfGoalDateUtc(targetDate);
  const currentCount = await countCheckedInOutingsForGoal(
    doc.userId,
    doc.activityFilter,
    periodStart,
    periodEnd
  );
  return {
    id: doc._id,
    activityFilter: doc.activityFilter,
    targetCount: doc.targetCount,
    targetDate,
    year: yearFromTargetDate(targetDate),
    currentCount,
    completed: currentCount >= doc.targetCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const getActiveMemberGoal = async (userId: string): Promise<MemberGoalDTO | null> => {
  const doc = await goalsCollection().findOne({ userId }, { sort: { updatedAt: -1 } });
  if (!doc) return null;
  const dto = await toDto(doc);
  void import('../services/member-goal-notifications.js')
    .then((mod) => mod.maybeNotifyGoalBehindPace(userId))
    .catch(() => undefined);
  return dto;
};

export const getMemberGoalPublicSnapshot = async (
  userId: string
): Promise<MemberGoalPublicDTO | null> => {
  const doc = await goalsCollection().findOne({ userId }, { sort: { updatedAt: -1 } });
  if (!doc) return null;
  const dto = await toDto(doc);
  const deadlinePassed = endOfGoalDateUtc(dto.targetDate).getTime() < Date.now();
  if (deadlinePassed && !dto.completed) return null;
  return {
    activityFilter: dto.activityFilter,
    targetCount: dto.targetCount,
    targetDate: dto.targetDate,
    year: dto.year,
    currentCount: dto.currentCount,
    completed: dto.completed,
  };
};

const normalizeTargetDateInput = (input: UpsertMemberGoalInput): string => {
  if (input.targetDate && ISO_DATE.test(input.targetDate)) {
    return input.targetDate;
  }
  const year = input.year ?? new Date().getUTCFullYear();
  return defaultTargetDateForYear(year);
};

export const upsertMemberGoal = async (
  userId: string,
  input: UpsertMemberGoalInput
): Promise<MemberGoalDTO> => {
  const targetCount = Math.floor(input.targetCount);
  if (targetCount < 1 || targetCount > 999) {
    throw new ApiError(400, 'invalid_goal', 'Set a target between 1 and 999 outings.');
  }

  const targetDate = normalizeTargetDateInput(input);
  const today = todayIsoUtc();
  const existing = await goalsCollection().findOne({ userId });

  if (!existing && targetDate < today) {
    throw new ApiError(400, 'invalid_goal_date', 'Pick today or a future date for your goal.');
  }

  const year = yearFromTargetDate(targetDate);
  const now = new Date();

  if (existing) {
    await goalsCollection().updateOne(
      { _id: existing._id },
      {
        $set: {
          activityFilter: input.activityFilter,
          targetCount,
          year,
          targetDate,
          updatedAt: now,
          notifiedHalf: false,
          notifiedComplete: false,
        },
      }
    );
    const updated = await goalsCollection().findOne({ _id: existing._id });
    if (!updated) throw new ApiError(500, 'goal_save_failed', 'Could not save your goal.');
    return toDto(updated);
  }

  const doc: MongoMemberGoal = {
    _id: randomUUID(),
    userId,
    activityFilter: input.activityFilter,
    targetCount,
    year,
    targetDate,
    createdAt: now,
    updatedAt: now,
  };
  await goalsCollection().insertOne(doc);
  return toDto(doc);
};

export const clearMemberGoal = async (userId: string): Promise<void> => {
  await goalsCollection().deleteMany({ userId });
};
