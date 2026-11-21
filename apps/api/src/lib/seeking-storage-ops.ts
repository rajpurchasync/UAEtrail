/** Ops readiness for activity-canonical seeking storage — per-env runbook only. */
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { isParticipantIntentStubWriteEnabled } from '../services/participant-intent-activity-readthrough.js';

const intentsCollection = () => getMongoClient()!.db().collection(COLLECTIONS.PARTICIPANT_INTENTS);

/** Active legacy `participant_intents` rows not yet migrated (ops backfill marks `fulfilled`). */
const activeLegacyParticipantIntentPendingMigrationFilter = {
  status: 'active',
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

/** Active intents backfill cannot migrate (no lat/lng). */
export const activeParticipantIntentMissingCoordsFilter = {
  status: 'active',
  $and: [...activeLegacyParticipantIntentPendingMigrationFilter.$and, missingMapCoordinatesClause],
};

export type SeekingStorageStatusReport = {
  /** Always false in code — env flag removed (MIG-DISCO-REG). */
  participantIntentStubWriteEnabled: boolean;
  /** @deprecated Alias — use `activeLegacyIntentsPendingMigration`. */
  activeIntentsMissingSeekingActivity: number;
  activeLegacyIntentsPendingMigration: number;
  activeIntentsMissingCoordsSkippedByBackfill: number;
  readyToDisableStubWrite: boolean;
  recommendedSteps: string[];
};

export const loadSeekingStorageStatus = async (): Promise<SeekingStorageStatusReport> => {
  const participantIntentStubWriteEnabled = isParticipantIntentStubWriteEnabled();

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

/** Deploy gate — no active unmigrated `participant_intents` rows remain. */
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

  const { scheduleExploreMapCacheInvalidation } = await import('./explore-map-cache-schedule.js');
  scheduleExploreMapCacheInvalidation('seeking-storage-ops.map_cache');

  return { dryRun, matched: intentIds.length, cancelled: modifiedCount, intentIds };
};
