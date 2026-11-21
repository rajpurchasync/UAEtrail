/**
 * Roll stale public `member_availability` fixed slots forward so map pins stay discoverable.
 *
 * Usage: npm --workspace @uaetrail/api run refresh-availability-schedules
 */
import { refreshPublicAvailabilityFixedSchedules } from './seed-demo-availability-fixed.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const result = await refreshPublicAvailabilityFixedSchedules();
  console.log(
    `Availability schedule refresh: updated=${result.updated} rolledForward=${result.rolledForward}`
  );
});