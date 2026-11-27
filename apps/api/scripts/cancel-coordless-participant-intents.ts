/**
 * Cancel active participant intents that lack map coordinates (backfill cannot migrate them).
 *
 * Usage:
 *   npm --workspace @uaetrail/api run cancel-coordless-participant-intents -- --dry-run
 *   npm --workspace @uaetrail/api run cancel-coordless-participant-intents
 */
import { cancelActiveParticipantIntentsMissingCoords } from '../src/lib/retired-seeking-storage-purge.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const dryRun = process.argv.includes('--dry-run');

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const result = await cancelActiveParticipantIntentsMissingCoords({ dryRun });
  console.log(JSON.stringify(result, null, 2));

  if (!dryRun && result.cancelled > 0) {
    console.log('Re-run: npm run seeking:storage-status -- --strict');
  }
});
