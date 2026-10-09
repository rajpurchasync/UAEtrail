/**
 * M1 backfill: active participant intents → published seeking activities.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run backfill-seeking-activities
 *   npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run
 *   npm --workspace @uaetrail/api run backfill-seeking-activities -- --limit=100
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { backfillSeekingActivitiesForActiveIntents } from '../src/lib/participant-intents-store.js';

const parseArgs = () => {
  const dryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;
  return { dryRun, limit: Number.isFinite(limit) ? limit : undefined };
};

const main = async () => {
  const { dryRun, limit } = parseArgs();
  await connectMongo();

  const result = await backfillSeekingActivitiesForActiveIntents({ dryRun, limit });
  console.log(
    JSON.stringify(
      {
        dryRun,
        limit: limit ?? 500,
        ...result,
      },
      null,
      2
    )
  );

  if (result.errors.length > 0) {
    process.exitCode = 1;
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
