import type { MemberGoalActivityFilter } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import { findActivityDocInMongo, findLocationInMongo } from '../lib/entity-sync.js';
import {
  activityTypeCountsForGoal,
  countCheckedInOutingsForGoal,
  endOfGoalDateUtc,
  getActiveMemberGoal,
} from '../lib/member-goals-store.js';
import { COLLECTIONS } from '../lib/collections.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { getMongoClient } from '../lib/mongo.js';

const goalLabel = (filter: MemberGoalActivityFilter, plural = true): string => {
  if (filter === 'hiking') return plural ? 'hikes' : 'hike';
  if (filter === 'camping') return plural ? 'camps' : 'camp';
  return plural ? 'outings' : 'outing';
};

const formatGoalDeadline = (targetDate: string): string => {
  const [y, m, d] = targetDate.split('-').map((part) => parseInt(part, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/** Fire in-app milestones after a successful check-in (50% and complete). */
export const notifyMemberGoalAfterCheckIn = async (
  userId: string,
  activityId: string
): Promise<void> => {
  const goalRow = await getMongoClient()!
    .db()
    .collection<{
      _id: string;
      activityFilter: MemberGoalActivityFilter;
      targetCount: number;
      targetDate?: string;
      year: number;
      createdAt: Date;
      notifiedHalf?: boolean;
      notifiedComplete?: boolean;
    }>(COLLECTIONS.USER_GOALS)
    .findOne({ userId }, { sort: { updatedAt: -1 } });
  if (!goalRow) return;

  const eventDoc = await findActivityDocInMongo(activityId);
  if (!eventDoc) return;
  const location = await findLocationInMongo(eventDoc.locationId);
  const effectiveType = eventDoc.activityType ?? location?.activityType ?? null;
  if (!activityTypeCountsForGoal(effectiveType, goalRow.activityFilter)) return;

  const targetDate =
    goalRow.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(goalRow.targetDate)
      ? goalRow.targetDate
      : `${goalRow.year}-12-31`;
  const currentCount = await countCheckedInOutingsForGoal(
    userId,
    goalRow.activityFilter,
    goalRow.createdAt,
    endOfGoalDateUtc(targetDate)
  );
  const target = goalRow.targetCount;
  const halfThreshold = Math.max(1, Math.ceil(target / 2));
  const byLabel = formatGoalDeadline(targetDate);

  const updates: Record<string, boolean> = {};

  if (currentCount >= target && !goalRow.notifiedComplete) {
    await createNotificationRecord({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Goal complete!',
      body: `You hit your ${target} ${goalLabel(goalRow.activityFilter)} goal by ${byLabel}.`,
      meta: { kind: 'goal_complete', path: '/profile' },
    });
    updates.notifiedComplete = true;
    updates.notifiedHalf = true;
  } else if (currentCount >= halfThreshold && currentCount < target && !goalRow.notifiedHalf) {
    await createNotificationRecord({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Halfway there',
      body: `${currentCount} of ${target} ${goalLabel(goalRow.activityFilter)} toward your ${byLabel} goal — keep going.`,
      meta: { kind: 'goal_halfway', path: '/profile' },
    });
    updates.notifiedHalf = true;
  }

  if (Object.keys(updates).length > 0) {
    await getMongoClient()!
      .db()
      .collection<{ _id: string }>(COLLECTIONS.USER_GOALS)
      .updateOne({ _id: goalRow._id }, { $set: updates });
  }
};

/** Optional nudge when loading goal if user is behind a simple linear pace (once per month max). */
export const maybeNotifyGoalBehindPace = async (userId: string): Promise<void> => {
  const goal = await getActiveMemberGoal(userId);
  if (!goal || goal.completed) return;

  const now = new Date();
  const periodEnd = endOfGoalDateUtc(goal.targetDate);
  const periodStart = new Date(goal.createdAt);
  if (now.getTime() > periodEnd.getTime()) return;

  const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
  const elapsedMs = Math.max(0, now.getTime() - periodStart.getTime());
  const expectedByNow = Math.floor((goal.targetCount * elapsedMs) / totalMs);
  if (goal.currentCount >= expectedByNow) return;
  if (elapsedMs < 14 * 24 * 60 * 60 * 1000) return;

  const row = await getMongoClient()!
    .db()
    .collection<{ _id: string; lastPaceNudgeAt?: Date }>(COLLECTIONS.USER_GOALS)
    .findOne({ userId }, { sort: { updatedAt: -1 } });
  if (!row) return;

  const last = row.lastPaceNudgeAt;
  if (last && now.getTime() - last.getTime() < 28 * 24 * 60 * 60 * 1000) return;

  await createNotificationRecord({
    userId,
    type: NotificationType.SYSTEM,
    title: 'Your outdoor goal',
    body: `${goal.currentCount} of ${goal.targetCount} ${goalLabel(goal.activityFilter)} so far — explore trips to catch up.`,
    meta: { kind: 'goal_behind_pace', path: '/trips?segment=upcoming&tab=joined' },
  });

  await getMongoClient()!
    .db()
    .collection<{ _id: string; lastPaceNudgeAt?: Date }>(COLLECTIONS.USER_GOALS)
    .updateOne({ _id: row._id }, { $set: { lastPaceNudgeAt: now } });
};
