/**
 * Refresh demo explore activities (dates + rideshare car snapshot on seed rides).
 *
 * Usage: npm --workspace @uaetrail/api run ensure-demo-explore-activities
 */
import { ensureDemoExploreActivities } from './seed-demo-scheduled-activities.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const ok = await ensureDemoExploreActivities();
  if (!ok) {
    process.exitCode = 1;
    console.error(
      '[seed] ensure failed — run full seed (SEED_DATA=true npm run seed) if demo users are missing'
    );
  }
});
