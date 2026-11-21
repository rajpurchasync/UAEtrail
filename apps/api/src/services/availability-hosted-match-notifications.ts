/**
 * Nudge availability ↔ hosted outings when calendar day + activity type align (location-agnostic).
 */
import { NotificationType } from '../domain/enums.js';
import { COLLECTIONS } from '../lib/collections.js';
import { getMongoClient } from '../lib/mongo.js';
import { listPublishedActivitiesForExploreMapFromMongo } from '../lib/activity-read-assembler.js';
import { createNotificationsMany } from '../lib/notifications-store.js';
import { activityDetailPath } from '../lib/member-routes.js';
import { findAreaById } from '../lib/areas-store.js';
import { isFixedAvailabilitySlot } from '@uaetrail/shared-types';
import { logger } from '../lib/logger.js';
import type { AvailabilityKind, MemberAvailabilityDTO } from '@uaetrail/shared-types';
import {
  availabilityKindMatchesActivityType,
  availabilityKindsForActivityType,
  memberAvailabilityCalendarDays,
  prunePastAvailabilitySlots,
} from '@uaetrail/shared-types';

const MAX_NOTIFY = 50;
const MAX_HOSTED_MATCHES = 3;
const HOSTED_SCAN = 120;

const activityCalendarDay = (startAt: Date): string =>
  new Date(startAt).toISOString().slice(0, 10);

const availabilityFromDoc = (doc: Record<string, unknown>): MemberAvailabilityDTO => ({
  userId: String(doc.userId),
  kinds: (doc.kinds as AvailabilityKind[]) ?? [],
  visibility: doc.visibility as MemberAvailabilityDTO['visibility'],
  region: doc.region ? String(doc.region) : null,
  areaId: doc.areaId ? String(doc.areaId) : null,
  note: doc.note ? String(doc.note) : null,
  slots: (doc.slots as MemberAvailabilityDTO['slots']) ?? [],
  updatedAt:
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : new Date().toISOString(),
});

const slotsOverlapActivityDay = (
  availability: MemberAvailabilityDTO,
  activityStartAt: Date
): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  const days = memberAvailabilityCalendarDays(
    prunePastAvailabilitySlots(availability.slots ?? [], today)
  );
  return days.includes(activityCalendarDay(activityStartAt));
};

/** Hosted outing published — members with matching day + activity kind. */
export const notifyAvailabilityHoldersOfHostedActivity = async (input: {
  activityId: string;
  hostUserId: string;
  activityTitle: string;
  activityStartAt: Date;
  activityType: string | null | undefined;
}): Promise<void> => {
  try {
    const kindFilter = availabilityKindsForActivityType(input.activityType);
    if (kindFilter.length === 0) return;

    const db = getMongoClient()!.db();
    const docs = await db
      .collection(COLLECTIONS.MEMBER_AVAILABILITY)
      .find({
        visibility: { $ne: 'hidden' },
        userId: { $ne: input.hostUserId },
        kinds: { $in: kindFilter },
      })
      .limit(MAX_NOTIFY)
      .toArray();

    const rows = [];
    for (const doc of docs) {
      const availability = availabilityFromDoc(doc as Record<string, unknown>);
      if (!slotsOverlapActivityDay(availability, input.activityStartAt)) continue;
      if (!availabilityKindMatchesActivityType(availability.kinds, input.activityType)) continue;
      rows.push({
        userId: availability.userId,
        title: 'An outing fits your availability',
        body: input.activityTitle,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'availability_hosted_match',
          activityId: input.activityId,
          path: activityDetailPath(input.activityId),
        },
      });
    }
    if (rows.length === 0) return;
    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, input }, 'availability hosted match notify failed');
  }
};


/** Member saved availability — surface hosted outings on overlapping days + types. */
export const notifyMemberOfHostedActivitiesForAvailability = async (input: {
  userId: string;
  availability: MemberAvailabilityDTO;
}): Promise<void> => {
  try {
    if (input.availability.visibility === 'hidden') return;
    const today = new Date().toISOString().slice(0, 10);
    const days = memberAvailabilityCalendarDays(
      prunePastAvailabilitySlots(input.availability.slots ?? [], today)
    );
    if (days.length === 0 || input.availability.kinds.length === 0) return;

    const daySet = new Set(days);
    const events = await listPublishedActivitiesForExploreMapFromMongo(HOSTED_SCAN);
    const matches = events
      .filter(
        (event) =>
          event.activityMode !== 'seeking' &&
          event.startAt &&
          daySet.has(activityCalendarDay(event.startAt)) &&
          availabilityKindMatchesActivityType(input.availability.kinds, event.activityType)
      )
      .slice(0, MAX_HOSTED_MATCHES);
    if (matches.length === 0) return;

    const lead = matches[0]!;
    const extra = matches.length > 1 ? ` (+${matches.length - 1} more)` : '';

    await createNotificationsMany([
      {
        userId: input.userId,
        title: 'Outings match your availability',
        body: `${lead.title}${extra}`,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'availability_find_match',
          activityId: lead.id,
          path: activityDetailPath(lead.id),
        },
      },
    ]);
  } catch (error) {
    logger.warn({ err: error, input: { userId: input.userId } }, 'availability find match notify failed');
  }
};

/** Hosted activity in an area — members with public fixed availability in that hub. */
export const notifyAvailabilityHoldersInAreaOfHostedActivity = async (input: {
  activityId: string;
  hostUserId: string;
  areaId: string;
  activityTitle: string;
  activityStartAt: Date;
  activityType: string | null | undefined;
}): Promise<void> => {
  try {
    const area = await findAreaById(input.areaId);
    const areaName = area?.name ?? 'this area';
    const kindFilter = availabilityKindsForActivityType(input.activityType);
    if (kindFilter.length === 0) return;

    const db = getMongoClient()!.db();
    const docs = await db
      .collection(COLLECTIONS.MEMBER_AVAILABILITY)
      .find({
        visibility: 'public',
        areaId: input.areaId,
        userId: { $ne: input.hostUserId },
        kinds: { $in: kindFilter },
      })
      .limit(MAX_NOTIFY)
      .toArray();

    const rows = [];
    for (const doc of docs) {
      const availability = availabilityFromDoc(doc as Record<string, unknown>);
      const hasFixed =
        (availability.slots ?? []).filter(isFixedAvailabilitySlot).length > 0;
      if (!hasFixed) continue;
      if (!slotsOverlapActivityDay(availability, input.activityStartAt)) continue;
      if (!availabilityKindMatchesActivityType(availability.kinds, input.activityType)) continue;
      rows.push({
        userId: availability.userId,
        title: `An outing in ${areaName} fits your availability`,
        body: input.activityTitle,
        type: NotificationType.ACTIVITY,
        meta: {
          kind: 'availability_area_hosted_match',
          areaId: input.areaId,
          activityId: input.activityId,
          path: activityDetailPath(input.activityId),
        },
      });
    }
    if (rows.length === 0) return;
    await createNotificationsMany(rows);
  } catch (error) {
    logger.warn({ err: error, input }, 'availability area hosted match notify failed');
  }
};
