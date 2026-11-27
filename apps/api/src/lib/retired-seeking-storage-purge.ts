/**
 * A-SEEK-02 — sole `apps/api/src` module for retired seeking / participant_intents residue
 * (purge, deploy gate, backfill, coordless cancel). Product Find crew = `member_availability` only.
 */
import type { Db } from 'mongodb';
import type { AvailabilityKind, MemberAvailabilitySlotDTO, ScheduleModality } from '@uaetrail/shared-types';
import { isScheduleModality, seekingFallbackTitle } from '@uaetrail/shared-types';
import { ActivityStatus } from '../domain/enums.js';
import { mongoOnlyRetiredSeekingActivityMode } from '../domain/retired-seeking-activity-mode.js';
import { BWL_RETIRED_SEEKING_COLLECTIONS } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { parseLocalDateTime } from './datetime.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
import { getMongoClient } from './mongo.js';

export type RetiredSeekingStoragePurgeReport = {
  participantIntentsCancelled: number;
  participantIntentRequestsDeleted: number;
  seekingActivitiesRetired: number;
  participantIntentFieldsUnset: number;
};

/**
 * Idempotent storage cleanup — cancels retired Find-as-activity rows and strips `participantIntentId`.
 * Prefer `purge-seeking-legacy-storage` CLI (backfill + slot migrate) before this when preserving map pins.
 */
export const purgeRetiredSeekingStorage = async (
  db: Db,
  options?: { dryRun?: boolean }
): Promise<RetiredSeekingStoragePurgeReport> => {
  const dryRun = options?.dryRun ?? false;
  const now = new Date();
  const intents = db.collection(BWL_RETIRED_SEEKING_COLLECTIONS.PARTICIPANT_INTENTS);
  const activities = db.collection(COLLECTIONS.ACTIVITIES);
  const intentRequests = db.collection(BWL_RETIRED_SEEKING_COLLECTIONS.PARTICIPANT_INTENT_REQUESTS);

  let participantIntentsCancelled = 0;
  let participantIntentRequestsDeleted = 0;
  let seekingActivitiesRetired = 0;
  let participantIntentFieldsUnset = 0;

  const activeIntentFilter = { status: 'active' as const };
  const activeIntentCount = await intents.countDocuments(activeIntentFilter);
  if (activeIntentCount > 0) {
    if (dryRun) {
      participantIntentsCancelled = activeIntentCount;
    } else {
      const result = await intents.updateMany(activeIntentFilter, {
        $set: { status: 'cancelled', updatedAt: now },
      });
      participantIntentsCancelled = result.modifiedCount;
    }
  }

  const requestCount = await intentRequests.countDocuments({});
  if (requestCount > 0) {
    if (dryRun) {
      participantIntentRequestsDeleted = requestCount;
    } else {
      const result = await intentRequests.deleteMany({});
      participantIntentRequestsDeleted = result.deletedCount;
    }
  }

  const seekingFilter = mongoOnlyRetiredSeekingActivityMode;
  const seekingCount = await activities.countDocuments(seekingFilter);
  if (seekingCount > 0) {
    if (dryRun) {
      seekingActivitiesRetired = seekingCount;
    } else {
      const result = await activities.updateMany(seekingFilter, {
        $set: { status: ActivityStatus.CANCELLED, updatedAt: now },
        $unset: { activityMode: '', participantIntentId: '' },
      });
      seekingActivitiesRetired = result.modifiedCount;
    }
  }

  const strayIntentFieldFilter = {
    participantIntentId: { $exists: true, $nin: [null, ''] },
  };
  const strayCount = await activities.countDocuments(strayIntentFieldFilter);
  if (strayCount > 0) {
    if (dryRun) {
      participantIntentFieldsUnset = strayCount;
    } else {
      const result = await activities.updateMany(strayIntentFieldFilter, {
        $unset: { participantIntentId: '' },
        $set: { updatedAt: now },
      });
      participantIntentFieldsUnset = result.modifiedCount;
    }
  }

  if (!dryRun && (participantIntentsCancelled > 0 || seekingActivitiesRetired > 0)) {
    scheduleExploreMapCacheInvalidation('retired-seeking-storage-purge');
  }

  return {
    participantIntentsCancelled,
    participantIntentRequestsDeleted,
    seekingActivitiesRetired,
    participantIntentFieldsUnset,
  };
};

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
  destinationId?: string | null;
  createdAt: Date;
};

const intentsCollection = () =>
  getMongoClient()!.db().collection<MongoParticipantIntent>(
    BWL_RETIRED_SEEKING_COLLECTIONS.PARTICIPANT_INTENTS
  );

const activeLegacyParticipantIntentPendingMigrationFilter = {
  status: 'active' as const,
  $and: [
    { $or: [{ activityId: { $exists: false } }, { activityId: null }] },
    { $or: [{ seekingActivityId: { $exists: false } }, { seekingActivityId: null }] },
  ],
};

const missingMapCoordinatesClause = {
  $or: [
    { latitude: { $exists: false } },
    { latitude: null },
    { longitude: { $exists: false } },
    { longitude: null },
  ],
};

export const activeParticipantIntentMissingCoordsFilter = {
  status: 'active' as const,
  $and: [...activeLegacyParticipantIntentPendingMigrationFilter.$and, missingMapCoordinatesClause],
};

const resolveStoredDemandTitle = (doc: MongoParticipantIntent): string =>
  doc.title?.trim() || seekingFallbackTitle(doc.kind === 'other' ? 'hiking' : doc.kind);

const intentKindToAvailabilityKind = (kind: LegacyParticipantIntentKind): AvailabilityKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') return kind;
  return 'other';
};

const intentKindToScheduleModality = (kind: LegacyParticipantIntentKind): ScheduleModality =>
  isScheduleModality(kind) ? kind : 'other';

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
    capacity: 'participant',
    modalities: [intentKindToScheduleModality(doc.kind)],
  };
};

export type SeekingStorageStatusReport = {
  participantIntentStubWriteEnabled: boolean;
  /** @deprecated Alias — use `activeLegacyIntentsPendingMigration`. */
  activeIntentsMissingSeekingActivity: number;
  activeLegacyIntentsPendingMigration: number;
  activeIntentsMissingCoordsSkippedByBackfill: number;
  readyToDisableStubWrite: boolean;
  recommendedSteps: string[];
};

export const loadSeekingStorageStatus = async (): Promise<SeekingStorageStatusReport> => {
  const participantIntentStubWriteEnabled = false;

  const [missingSeekingActivity, missingCoords] = await Promise.all([
    intentsCollection().countDocuments(activeLegacyParticipantIntentPendingMigrationFilter),
    intentsCollection().countDocuments(activeParticipantIntentMissingCoordsFilter),
  ]);

  const readyToDisableStubWrite = missingSeekingActivity === 0;

  const recommendedSteps: string[] = [];
  if (missingSeekingActivity > 0) {
    recommendedSteps.push(
      `Run intent backfill (migrates to member_availability): npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run then without --dry-run (${missingSeekingActivity} active intent(s) pending).`
    );
    recommendedSteps.push(
      'Optional: migrate published seeking activities → fixed slots: npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --dry-run'
    );
  }
  if (missingCoords > 0) {
    recommendedSteps.push(
      `${missingCoords} active intent(s) lack coordinates — backfill skips them; fix coords or run: npm --workspace @uaetrail/api run cancel-coordless-participant-intents -- --dry-run`
    );
  }
  if (readyToDisableStubWrite) {
    recommendedSteps.push('Seeking storage ready — Find crew uses member_availability (MIG-DISCO-REG).');
  }
  if (recommendedSteps.length === 0) {
    recommendedSteps.push('No action required.');
  }

  return {
    participantIntentStubWriteEnabled,
    activeIntentsMissingSeekingActivity: missingSeekingActivity,
    activeLegacyIntentsPendingMigration: missingSeekingActivity,
    activeIntentsMissingCoordsSkippedByBackfill: missingCoords,
    readyToDisableStubWrite,
    recommendedSteps,
  };
};

export const seekingStorageStrictGateFails = (report: SeekingStorageStatusReport): boolean =>
  !report.readyToDisableStubWrite;

export type CancelCoordlessParticipantIntentsResult = {
  dryRun: boolean;
  matched: number;
  cancelled: number;
  intentIds: string[];
};

export const cancelActiveParticipantIntentsMissingCoords = async (options?: {
  dryRun?: boolean;
}): Promise<CancelCoordlessParticipantIntentsResult> => {
  const dryRun = options?.dryRun ?? false;
  const docs = await intentsCollection()
    .find(activeParticipantIntentMissingCoordsFilter, { projection: { _id: 1 } })
    .toArray();
  const intentIds = docs.map((doc) => String(doc._id));

  if (dryRun || intentIds.length === 0) {
    return { dryRun, matched: intentIds.length, cancelled: dryRun ? 0 : 0, intentIds };
  }

  const now = new Date();
  const { modifiedCount } = await intentsCollection().updateMany(
    activeParticipantIntentMissingCoordsFilter,
    { $set: { status: 'cancelled', updatedAt: now } }
  );

  scheduleExploreMapCacheInvalidation('retired-seeking-storage-purge');

  return { dryRun, matched: intentIds.length, cancelled: modifiedCount, intentIds };
};

export const backfillSeekingActivitiesForActiveIntents = async (options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{ scanned: number; created: number; skipped: number; errors: string[] }> => {
  const limit = options?.limit ?? 500;
  const docs = await intentsCollection()
    .find(activeLegacyParticipantIntentPendingMigrationFilter)
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
        destinationId: doc.destinationId ?? null,
        note: doc.comment?.trim() || null,
        fixedSlots: [slot],
      });
      await intentsCollection().updateOne(
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
    scheduleExploreMapCacheInvalidation('retired-seeking-storage-purge');
  }

  return { scanned: docs.length, created, skipped, errors };
};