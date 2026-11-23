import type { AvailabilityKind, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { seekingFallbackTitle } from '@uaetrail/shared-types';
import { parseLocalDateTime } from './datetime.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

type LegacyParticipantIntentKind = 'hiking' | 'camping' | 'rideshare' | 'event' | 'other';

type MongoParticipantIntent = {
  _id: string;
  userId: string;
  kind: LegacyParticipantIntentKind;
  title?: string | null;
  date: string | null;
  time: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific' | null;
  comment: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  activityId?: string | null;
  seekingActivityId?: string | null;
  areaId?: string | null;
  createdAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS);

const resolveStoredDemandTitle = (doc: MongoParticipantIntent): string =>
  doc.title?.trim() || seekingFallbackTitle(doc.kind === 'other' ? 'hiking' : doc.kind);

const intentKindToAvailabilityKind = (kind: LegacyParticipantIntentKind): AvailabilityKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') return kind;
  return 'other';
};

const participantIntentDocToFixedSlot = (
  doc: MongoParticipantIntent,
  countryCode = 'AE'
): MemberAvailabilitySlotDTO | null => {
  if (doc.latitude == null || doc.longitude == null) return null;
  const day =
    doc.date?.trim() ||
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const time = doc.time?.trim() || '09:00';
  const startAt = parseLocalDateTime(day, time, countryCode).toISOString();
  return {
    slotId: doc._id,
    scheduleKind: 'fixed',
    startDate: day,
    endDate: day,
    startAt,
    endAt: startAt,
    title: resolveStoredDemandTitle(doc),
    latitude: doc.latitude,
    longitude: doc.longitude,
    locationPrecision: doc.locationPrecision ?? 'general',
    timeBand: null,
  };
};

/** Ops backfill — active legacy intents → fixed `member_availability` slots. */
export const backfillSeekingActivitiesForActiveIntents = async (options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{ scanned: number; created: number; skipped: number; errors: string[] }> => {
  const limit = options?.limit ?? 500;
  const docs = await collection()
    .find({
      status: 'active',
      $and: [
        { $or: [{ activityId: { $exists: false } }, { activityId: null }] },
        { $or: [{ seekingActivityId: { $exists: false } }, { seekingActivityId: null }] },
      ],
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  const { mergeMemberAvailabilityFixedSlotsMigration } = await import('./member-availability-store.js');

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const slot = participantIntentDocToFixedSlot(doc);
    if (!slot) {
      skipped += 1;
      continue;
    }

    if (options?.dryRun) {
      created += 1;
      continue;
    }

    try {
      await mergeMemberAvailabilityFixedSlotsMigration(doc.userId, {
        kinds: [intentKindToAvailabilityKind(doc.kind)],
        visibility: 'public',
        areaId: doc.areaId ?? null,
        note: doc.comment?.trim() || null,
        fixedSlots: [slot],
      });
      await collection().updateOne(
        { _id: doc._id },
        {
          $set: {
            status: 'fulfilled',
            updatedAt: new Date(),
          },
        }
      );
      created += 1;
    } catch (error) {
      errors.push(`${doc._id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!options?.dryRun && created > 0) {
    scheduleExploreMapCacheInvalidation('participant-intents.map_cache');
  }

  return { scanned: docs.length, created, skipped, errors };
};