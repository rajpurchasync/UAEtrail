/**
 * Add garage cars for rideshare hosts and link existing rideshare activities.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run backfill-rideshare-vehicles
 *   npm --workspace @uaetrail/api run backfill-rideshare-vehicles -- --dry-run
 *   npm --workspace @uaetrail/api run backfill-rideshare-vehicles -- --limit=200
 */
import { backfillRideshareVehiclesForActivities } from '../src/lib/backfill-rideshare-vehicles.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const parseArgs = () => {
  const dryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number.parseInt(limitArg.split('=')[1] ?? '', 10) : undefined;
  return { dryRun, limit: Number.isFinite(limit) ? limit : undefined };
};

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const { dryRun, limit } = parseArgs();
  const result = await backfillRideshareVehiclesForActivities({ dryRun, limit });
  console.log(JSON.stringify(result, null, 2));
});
