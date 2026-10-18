/**
 * Phase D — when Find posts and hosted outings share a curated `areaId`, nudge the other side.
 */
import { NotificationType } from '../domain/enums.js';
import { ActivityStatus } from '../domain/enums.js';
import { COLLECTIONS } from '../lib/collections.js';
import { getMongoClient } from '../lib/mongo.js';
import { listPublishedUpcomingActivitiesByArea } from '../lib/activities-store.js';
import { findAreaById } from '../lib/areas-store.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { activityDetailPath } from '../lib/member-routes.js';
import { logger } from '../lib/logger.js';
import { LocationStatus } from '../domain/enums.js';

const MAX_SEEKER_NOTIFICATIONS = 25;
const MAX_HOSTED_MATCHES_FOR_SEEKER = 3;

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const intentDateWithinWindow = (intentDate: string | null, activityStart: Date): boolean => {
  if (!intentDate?.trim()) return true;
  const intentDay = new Date(`${intentDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(intentDay.getTime())) return true;
  const activityDay = new Date(activityStart);
  activityDay.setHours(12, 0, 0, 0);
  const diffDays = Math.abs(activityDay.getTime() - intentDay.getTime()) / (24 * 60 * 60 * 1000);
  return diffDays <= 14;
};

type ActiveSeekingRow = {
  userId: string;
  intentId: string;
  title: string;
  date: string | null;
  activityId: string | null;
};

const listActiveSeekingInArea = async (
  areaId: string,
  excludeUserId?: string
): Promise<ActiveSeekingRow[]> => {
  const db = getMongoClient()!.db();
  const rows: ActiveSeekingRow[] = [];

  const locationIds = await db
    .collection(COLLECTIONS.LOCATIONS)
    .find({ areaId, status: LocationStatus.ACTIVE })
    .project({ _id: 1 })
    .limit(500)
    .toArray();
  const locationIdList = locationIds.map((row) => row._id);

  const activityDocs = await db
    .collection(COLLECTIONS.ACTIVITIES)
    .find({
      status: ActivityStatus.PUBLISHED,
      activityMode: 'seeking',
      startAt: { $gte: startOfToday() },
      $or: [{ locationId: { $in: locationIdList } }, { areaId }],
    })
    .limit(MAX_SEEKER_NOTIFICATIONS)
    .toArray();

  const seenUsers = new Set<string>();
  for (const doc of activityDocs) {
    const userId = String(doc.hostId ?? doc.createdById);
    if (excludeUserId && userId === excludeUserId) continue;
    if (seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    rows.push({
      userId,
      intentId: doc.participantIntentId ? String(doc.participantIntentId) : String(doc._id),
      title: String(doc.title ?? 'Looking for crew'),
      date: doc.startAt ? new Date(doc.startAt).toISOString().slice(0, 10) : null,
      activityId: String(doc._id),
    });
  }

  return rows.slice(0, MAX_SEEKER_NOTIFICATIONS);
};

/** Hosted activity published — tell active Find posters in the same area. */
export const notifySeekersOfHostedActivityInArea = async (input: {
  activityId: string;
  hostUserId: string;
  areaId: string;
  activityTitle: string;
  activityStartAt: Date;
}): Promise<void> => {
  try {
    const area = await findAreaById(input.areaId);
    const areaName = area?.name ?? 'this area';
    const seekers = await listActiveSeekingInArea(input.areaId, input.hostUserId);
    if (seekers.length === 0) return;

    const rows = seekers
      .filter((seeker) => intentDateWithinWindow(seeker.date, input.activityStartAt))
      .map((seeker) => ({
        userId: seeker.userId,
        title: `An outing in ${areaName} matches your looking-for post`,
        body: input.activityTitle,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'seeking_area_hosted_match',
          areaId: input.areaId,
          activityId: input.activityId,
          intentId: seeker.intentId,
          path: activityDetailPath(input.activityId),
        },
      }));

    if (rows.length === 0) return;
    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, input }, 'seeking area match (hosted) notify failed');
  }
};

/** New Find post — surface upcoming hosted outings in the same area. */
export const notifySeekerOfHostedActivitiesInArea = async (input: {
  seekerUserId: string;
  areaId: string;
  intentId: string;
  seekingActivityId?: string | null;
  intentDate?: string | null;
}): Promise<void> => {
  try {
    const area = await findAreaById(input.areaId);
    const areaName = area?.name ?? 'this area';
    const hosted = await listPublishedUpcomingActivitiesByArea(input.areaId, MAX_HOSTED_MATCHES_FOR_SEEKER);
    const matches = hosted.filter((event) =>
      intentDateWithinWindow(input.intentDate ?? null, event.startAt)
    );
    if (matches.length === 0) return;

    const lead = matches[0]!;
    const extra = matches.length > 1 ? ` (+${matches.length - 1} more)` : '';
    const path = activityDetailPath(lead.id);

    await createNotificationsMany([
      {
        userId: input.seekerUserId,
        title: `Outings in ${areaName} match what you are looking for`,
        body: `${lead.title}${extra}`,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'seeking_area_find_match',
          areaId: input.areaId,
          activityId: lead.id,
          intentId: input.intentId,
          seekingActivityId: input.seekingActivityId ?? undefined,
          path,
        },
      },
    ]);
  } catch (error) {
    logger.warn({ err: error, input }, 'seeking area match (find) notify failed');
  }
};
