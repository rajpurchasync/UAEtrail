/**
 * Ops backfill: active legacy `participant_intents` → fixed `member_availability` slots.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run backfill-seeking-activities
 *   npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run
 *   npm --workspace @uaetrail/api run backfill-seeking-activities -- --limit=100
 */
import { backfillSeekingActivitiesForActiveIntents } from '../src/lib/participant-intents-store.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const parseArgs = () => {
  const dryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;
  return { dryRun, limit: Number.isFinite(limit) ? limit : undefined };
};

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const { dryRun, limit } = parseArgs();
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
});
