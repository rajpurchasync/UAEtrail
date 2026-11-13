/**
 * Sync active participant-intent dates → linked `activityMode: seeking` rows.
 * Rolls past intent dates forward so map / Find crew / list stay populated.
 *
 * Usage: npm --workspace @uaetrail/api run refresh-seeking-schedules
 */
import { refreshActiveParticipantSeekingSchedules } from './seed-demo-seeking-schedules.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const result = await refreshActiveParticipantSeekingSchedules();
  console.log(
    `Seeking schedule refresh: updated=${result.updated} rolledForward=${result.rolledForward}`
  );
});
