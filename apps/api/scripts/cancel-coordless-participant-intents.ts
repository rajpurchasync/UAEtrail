/**
 * Cancel active participant intents that lack map coordinates (backfill cannot migrate them).
 *
 * Usage:
 *   npm --workspace @uaetrail/api run cancel-coordless-participant-intents -- --dry-run
 *   npm --workspace @uaetrail/api run cancel-coordless-participant-intents
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { cancelActiveParticipantIntentsMissingCoords } from '../src/lib/seeking-m2d-ops.js';

const dryRun = process.argv.includes('--dry-run');

const main = async () => {
  await connectMongo();
  const result = await cancelActiveParticipantIntentsMissingCoords({ dryRun });
  console.log(JSON.stringify(result, null, 2));

  if (!dryRun && result.cancelled > 0) {
    console.log('Re-run: npm run seeking:m2d-status -- --strict');
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
