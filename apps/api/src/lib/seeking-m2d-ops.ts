import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { isParticipantIntentStubWriteEnabled } from '../services/participant-intent-activity-readthrough.js';

const intentsCollection = () => getMongoClient()!.db().collection(COLLECTIONS.PARTICIPANT_INTENTS);

const activeIntentMissingSeekingActivityFilter = {
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
  $and: [...activeIntentMissingSeekingActivityFilter.$and, missingMapCoordinatesClause],
};

export type SeekingM2dStatusReport = {
  participantIntentStubWriteEnabled: boolean;
  activeIntentsMissingSeekingActivity: number;
  activeIntentsMissingCoordsSkippedByBackfill: number;
  readyToDisableStubWrite: boolean;
  recommendedSteps: string[];
};

export const loadSeekingM2dStatus = async (): Promise<SeekingM2dStatusReport> => {
  const participantIntentStubWriteEnabled = isParticipantIntentStubWriteEnabled();

  const [missingSeekingActivity, missingCoords] = await Promise.all([
    intentsCollection().countDocuments(activeIntentMissingSeekingActivityFilter),
    intentsCollection().countDocuments(activeParticipantIntentMissingCoordsFilter),
  ]);

  const readyToDisableStubWrite = missingSeekingActivity === 0;

  const recommendedSteps: string[] = [];
  if (missingSeekingActivity > 0) {
    recommendedSteps.push(
      `Run backfill: npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run then without --dry-run (${missingSeekingActivity} active intent(s) still missing seeking activity).`
    );
  }
  if (missingCoords > 0) {
    recommendedSteps.push(
      `${missingCoords} active intent(s) lack coordinates — backfill skips them; fix coords or run: npm --workspace @uaetrail/api run cancel-coordless-participant-intents -- --dry-run`
    );
  }
  if (readyToDisableStubWrite && participantIntentStubWriteEnabled) {
    recommendedSteps.push(
      'Set PARTICIPANT_INTENT_STUB_WRITE=false on API after deploy (M2d — Find writes activities only).'
    );
  }
  if (readyToDisableStubWrite && !participantIntentStubWriteEnabled) {
    recommendedSteps.push('M2d complete for this database — stub write is already disabled.');
  }
  if (recommendedSteps.length === 0) {
    recommendedSteps.push('No action required.');
  }

  return {
    participantIntentStubWriteEnabled,
    activeIntentsMissingSeekingActivity: missingSeekingActivity,
    activeIntentsMissingCoordsSkippedByBackfill: missingCoords,
    readyToDisableStubWrite,
    recommendedSteps,
  };
};

/** Deploy gate — backfill complete and stub write off (or not yet ready to flip). */
export const seekingM2dStrictGateFails = (report: SeekingM2dStatusReport): boolean =>
  !report.readyToDisableStubWrite || report.participantIntentStubWriteEnabled;

export type CancelCoordlessParticipantIntentsResult = {
  dryRun: boolean;
  matched: number;
  cancelled: number;
  intentIds: string[];
};

/**
 * Ops helper — active intents without map coordinates cannot backfill to seeking activities.
 * Cancels them so `activeIntentsMissingSeekingActivity` can reach 0.
 */
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

  const { invalidateExploreMapCache } = await import('./explore-map-cache.js');
  await invalidateExploreMapCache();

  return { dryRun, matched: intentIds.length, cancelled: modifiedCount, intentIds };
};
