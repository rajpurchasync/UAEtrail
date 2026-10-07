import { randomUUID } from 'crypto';
import { MAX_MEMBER_GOALS } from '@uaetrail/shared-types';
import type {
  MemberGoalActivityFilter,
  MemberGoalCountMode,
  MemberGoalDTO,
  MemberGoalPublicDTO,
  UpsertMemberGoalInput,
} from '@uaetrail/shared-types';
import { ActivityStatus } from '../domain/enums.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  activityTypeCountsForGoal,
  mapPinActivityTypeCountsForGoal,
} from './goal-activity-alignment.js';

type MongoMemberGoal = {
  _id: string;
  userId: string;
  activityFilter: MemberGoalActivityFilter;
  countMode?: MemberGoalCountMode;
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

const goalPeriodStartIso = (createdAt: Date): string => createdAt.toISOString().slice(0, 10);

const resolveCountMode = (doc: Pick<MongoMemberGoal, 'countMode'>): MemberGoalCountMode =>
  doc.countMode === 'host' ? 'host' : 'join';

/** @deprecated Use goal-activity-alignment.activityTypeCountsForGoal */
export { activityTypeCountsForGoal };

export const countVisitedPinsForJoinGoal = async (
  userId: string,
  filter: MemberGoalActivityFilter,
  periodStart: Date,
  periodEnd: Date
): Promise<number> => {
  const startIso = goalPeriodStartIso(periodStart);
  const endIso = periodEnd.toISOString().slice(0, 10);

  const pins = await getMongoClient()!
    .db()
    .collection<{
      kind: string;
      placeDate: string;
      activityType: string | null;
    }>(COLLECTIONS.MEMBER_MAP_PINS)
    .find({
      userId,
      kind: 'visited',
      placeDate: { $gte: startIso, $lte: endIso },
    })
    .project({ kind: 1, placeDate: 1, activityType: 1 })
    .toArray();

  return pins.filter((pin) => mapPinActivityTypeCountsForGoal(pin.activityType, filter)).length;
};

export const countHostedOutingsForGoal = async (
  userId: string,
  filter: MemberGoalActivityFilter,
  periodStart: Date,
  periodEnd: Date
): Promise<number> => {
  const rows = await getMongoClient()!
    .db()
    .collection(COLLECTIONS.ACTIVITIES)
    .aggregate<{ count: number }>([
      {
        $match: {
          $or: [{ hostId: userId }, { createdById: userId }],
          status: ActivityStatus.PUBLISHED,
          startAt: { $gte: periodStart, $lte: periodEnd },
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.LOCATIONS,
          localField: 'locationId',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          effectiveType: { $ifNull: ['$activityType', '$location.activityType'] },
        },
      },
      {
        $match: {
          effectiveType: {
            $in: filter === 'hiking'
              ? ['HIKING']
              : filter === 'camping'
                ? ['CAMPING']
                : ['HIKING', 'CAMPING', 'EVENT', 'RIDESHARE'],
          },
        },
      },
      { $count: 'count' },
    ])
    .toArray();

  return rows[0]?.count ?? 0;
};

/** @deprecated Use countVisitedPinsForJoinGoal — kept for notification migration path */
export const countCheckedInOutingsForGoal = countVisitedPinsForJoinGoal;

export const countGoalProgress = async (
  userId: string,
  activityFilter: MemberGoalActivityFilter,
  countMode: MemberGoalCountMode,
  periodStart: Date,
  periodEnd: Date
): Promise<number> => {
  if (countMode === 'host') {
    return countHostedOutingsForGoal(userId, activityFilter, periodStart, periodEnd);
  }
  return countVisitedPinsForJoinGoal(userId, activityFilter, periodStart, periodEnd);
};

const toDto = async (doc: MongoMemberGoal): Promise<MemberGoalDTO> => {
  const targetDate = resolveGoalTargetDate(doc);
  const periodStart = doc.createdAt;
  const periodEnd = endOfGoalDateUtc(targetDate);
  const countMode = resolveCountMode(doc);
  const currentCount = await countGoalProgress(
    doc.userId,
    doc.activityFilter,
    countMode,
    periodStart,
    periodEnd
  );
  return {
    id: doc._id,
    activityFilter: doc.activityFilter,
    countMode,
    targetCount: doc.targetCount,
    targetDate,
    year: yearFromTargetDate(targetDate),
    currentCount,
    completed: currentCount >= doc.targetCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

const sortGoalsNewestFirst = { updatedAt: -1 as const };

export const listMemberGoals = async (userId: string): Promise<MemberGoalDTO[]> => {
  const docs = await goalsCollection().find({ userId }).sort(sortGoalsNewestFirst).toArray();
  return Promise.all(docs.map((doc) => toDto(doc)));
};

const findPrimaryGoalDoc = async (userId: string): Promise<MongoMemberGoal | null> => {
  const docs = await goalsCollection().find({ userId }).sort(sortGoalsNewestFirst).toArray();
  if (docs.length === 0) return null;
  const incomplete = docs.find((doc) => {
    const targetDate = resolveGoalTargetDate(doc);
    const deadlinePassed = endOfGoalDateUtc(targetDate).getTime() < Date.now();
    return !deadlinePassed;
  });
  return incomplete ?? docs[0];
};

/** Primary goal for legacy `/me/goals/active` and Trips highlight — first in-progress, else newest. */
export const getActiveMemberGoal = async (userId: string): Promise<MemberGoalDTO | null> => {
  const doc = await findPrimaryGoalDoc(userId);
  if (!doc) return null;
  const dto = await toDto(doc);
  void import('../services/member-goal-notifications.js')
    .then((mod) => mod.maybeNotifyGoalBehindPace(userId))
    .catch(() => undefined);
  return dto;
};

export const getMemberGoalById = async (userId: string, goalId: string): Promise<MemberGoalDTO | null> => {
  const doc = await goalsCollection().findOne({ _id: goalId, userId });
  if (!doc) return null;
  return toDto(doc);
};

export const getMemberGoalPublicSnapshot = async (
  userId: string
): Promise<MemberGoalPublicDTO | null> => {
  const doc = await findPrimaryGoalDoc(userId);
  if (!doc) return null;
  const dto = await toDto(doc);
  const deadlinePassed = endOfGoalDateUtc(dto.targetDate).getTime() < Date.now();
  if (deadlinePassed && !dto.completed) return null;
  return {
    activityFilter: dto.activityFilter,
    countMode: dto.countMode,
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

const assertGoalInput = (input: UpsertMemberGoalInput) => {
  const targetCount = Math.floor(input.targetCount);
  if (targetCount < 1 || targetCount > 999) {
    throw new ApiError(400, 'invalid_goal', 'Set a target between 1 and 999 outings.');
  }
  return targetCount;
};

export const createMemberGoal = async (
  userId: string,
  input: UpsertMemberGoalInput
): Promise<MemberGoalDTO> => {
  const count = await goalsCollection().countDocuments({ userId });
  if (count >= MAX_MEMBER_GOALS) {
    throw new ApiError(400, 'goal_limit_reached', `You can track up to ${MAX_MEMBER_GOALS} goals at once.`);
  }

  const targetCount = assertGoalInput(input);
  const targetDate = normalizeTargetDateInput(input);
  const today = todayIsoUtc();
  if (targetDate < today) {
    throw new ApiError(400, 'invalid_goal_date', 'Pick today or a future date for your goal.');
  }

  const countMode: MemberGoalCountMode = input.countMode === 'host' ? 'host' : 'join';
  const year = yearFromTargetDate(targetDate);
  const now = new Date();

  const doc: MongoMemberGoal = {
    _id: randomUUID(),
    userId,
    activityFilter: input.activityFilter,
    countMode,
    targetCount,
    year,
    targetDate,
    createdAt: now,
    updatedAt: now,
  };
  await goalsCollection().insertOne(doc);
  return toDto(doc);
};

export const updateMemberGoal = async (
  userId: string,
  goalId: string,
  input: UpsertMemberGoalInput
): Promise<MemberGoalDTO> => {
  const existing = await goalsCollection().findOne({ _id: goalId, userId });
  if (!existing) {
    throw new ApiError(404, 'goal_not_found', 'Goal not found.');
  }

  const targetCount = assertGoalInput(input);
  const targetDate = normalizeTargetDateInput(input);
  const countMode: MemberGoalCountMode = input.countMode === 'host' ? 'host' : 'join';
  const year = yearFromTargetDate(targetDate);
  const now = new Date();

  await goalsCollection().updateOne(
    { _id: goalId, userId },
    {
      $set: {
        activityFilter: input.activityFilter,
        countMode,
        targetCount,
        year,
        targetDate,
        updatedAt: now,
        notifiedHalf: false,
        notifiedComplete: false,
      },
    }
  );
  const updated = await goalsCollection().findOne({ _id: goalId, userId });
  if (!updated) throw new ApiError(500, 'goal_save_failed', 'Could not save your goal.');
  return toDto(updated);
};

/** Legacy — updates primary goal or creates if none. */
export const upsertMemberGoal = async (
  userId: string,
  input: UpsertMemberGoalInput
): Promise<MemberGoalDTO> => {
  const primary = await findPrimaryGoalDoc(userId);
  if (primary) {
    return updateMemberGoal(userId, primary._id, input);
  }
  return createMemberGoal(userId, input);
};

export const deleteMemberGoal = async (userId: string, goalId: string): Promise<void> => {
  const result = await goalsCollection().deleteOne({ _id: goalId, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'goal_not_found', 'Goal not found.');
  }
};

export const clearMemberGoal = async (userId: string): Promise<void> => {
  await goalsCollection().deleteMany({ userId });
};
