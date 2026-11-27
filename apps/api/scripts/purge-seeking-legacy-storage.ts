/**
 * Dev/staging cleanup — migrate then purge legacy Find crew storage.
 *
 *   npm --workspace @uaetrail/api run purge-seeking-legacy-storage -- --dry-run
 *   npm --workspace @uaetrail/api run purge-seeking-legacy-storage
 */
import { getMongoClient } from '../src/lib/mongo.js';
import {
  backfillSeekingActivitiesForActiveIntents,
  cancelActiveParticipantIntentsMissingCoords,
  purgeRetiredSeekingStorage,
} from '../src/lib/retired-seeking-storage-purge.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const dryRun = process.argv.includes('--dry-run');

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  if (!dryRun) {
    const backfill = await backfillSeekingActivitiesForActiveIntents({ limit: 2000 });
    console.log('[purge] participant_intents backfill', backfill);
    const cancelledCoords = await cancelActiveParticipantIntentsMissingCoords({ dryRun: false });
    console.log('[purge] cancel coordless intents', cancelledCoords);
    await backfillSeekingActivitiesForActiveIntents({ limit: 2000 });
  } else {
    console.log('[purge] DRY_RUN — skipping backfill / cancel-coordless');
  }

  const db = getMongoClient()!.db();
  const report = await purgeRetiredSeekingStorage(db, { dryRun });
  console.log(JSON.stringify({ dryRun, ...report }, null, 2));
});