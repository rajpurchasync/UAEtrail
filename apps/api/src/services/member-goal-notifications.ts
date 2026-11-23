import type { MemberGoalActivityFilter, MemberGoalCountMode } from '@uaetrail/shared-types';
import { NotificationType } from '../domain/enums.js';
import {
  countGoalProgress,
  endOfGoalDateUtc,
  getActiveMemberGoal,
  resolveGoalTargetDate,
} from '../lib/member-goals-store.js';
import { COLLECTIONS } from '../lib/collections.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { getMongoClient } from '../lib/mongo.js';
import { PROFILE_PATH, planJoinedSchedulePath } from '../lib/member-routes.js';

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

type GoalRow = {
  _id: string;
  activityFilter: MemberGoalActivityFilter;
  countMode?: MemberGoalCountMode;
  targetCount: number;
  targetDate?: string;
  year: number;
  createdAt: Date;
  notifiedHalf?: boolean;
  notifiedComplete?: boolean;
};

const evaluateGoalMilestones = async (userId: string, goalRow: GoalRow): Promise<void> => {
  const targetDate = resolveGoalTargetDate(goalRow);
  const countMode = goalRow.countMode === 'host' ? 'host' : 'join';
  const currentCount = await countGoalProgress(
    userId,
    goalRow.activityFilter,
    countMode,
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
      meta: { kind: 'goal_complete', path: PROFILE_PATH },
    });
    updates.notifiedComplete = true;
    updates.notifiedHalf = true;
  } else if (currentCount >= halfThreshold && currentCount < target && !goalRow.notifiedHalf) {
    await createNotificationRecord({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Halfway there',
      body: `${currentCount} of ${target} ${goalLabel(goalRow.activityFilter)} toward your ${byLabel} goal — keep going.`,
      meta: { kind: 'goal_halfway', path: PROFILE_PATH },
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

/** Fire in-app milestones after progress changes (check-in, manual log, host outing). */
export const notifyMemberGoalAfterProgress = async (userId: string): Promise<void> => {
  const rows = await getMongoClient()!
    .db()
    .collection<GoalRow>(COLLECTIONS.USER_GOALS)
    .find({ userId })
    .toArray();

  for (const goalRow of rows) {
    await evaluateGoalMilestones(userId, goalRow);
  }
};

/** @deprecated Prefer notifyMemberGoalAfterProgress */
export const notifyMemberGoalAfterCheckIn = async (userId: string, _activityId: string): Promise<void> => {
  await notifyMemberGoalAfterProgress(userId);
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
    .findOne({ _id: goal.id });
  if (!row) return;

  const last = row.lastPaceNudgeAt;
  if (last && now.getTime() - last.getTime() < 28 * 24 * 60 * 60 * 1000) return;

  await createNotificationRecord({
    userId,
    type: NotificationType.SYSTEM,
    title: 'Your outdoor goal',
    body: `${goal.currentCount} of ${goal.targetCount} ${goalLabel(goal.activityFilter)} so far — log outings or explore trips to catch up.`,
    meta: { kind: 'goal_behind_pace', path: planJoinedSchedulePath() },
  });

  await getMongoClient()!
    .db()
    .collection<{ _id: string; lastPaceNudgeAt?: Date }>(COLLECTIONS.USER_GOALS)
    .updateOne({ _id: row._id }, { $set: { lastPaceNudgeAt: now } });
};
