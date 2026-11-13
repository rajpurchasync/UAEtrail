/**
 * Ops readiness for activity-canonical seeking storage.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run seeking-storage-status
 *   npm --workspace @uaetrail/api run seeking-storage-status -- --strict
 */
import { loadSeekingStorageStatus, seekingStorageStrictGateFails } from '../src/lib/seeking-storage-ops.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const strict = process.argv.includes('--strict');

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const report = await loadSeekingStorageStatus();
  console.log(JSON.stringify(report, null, 2));

  if (strict && seekingStorageStrictGateFails(report)) {
    process.exitCode = 1;
  }
});
