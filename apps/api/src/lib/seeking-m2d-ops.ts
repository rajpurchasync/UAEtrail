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
    intentsCollection().countDocuments({
      status: 'active',
      $and: [
        ...activeIntentMissingSeekingActivityFilter.$and,
        {
          $or: [
            { latitude: { $exists: false } },
            { latitude: null },
            { longitude: { $exists: false } },
            { longitude: null },
          ],
        },
      ],
    }),
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
      `${missingCoords} active intent(s) lack coordinates — backfill skips them; cancel or fix manually.`
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
