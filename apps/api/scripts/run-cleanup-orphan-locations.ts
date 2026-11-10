import { deactivateOrphanActiveLocations } from './cleanup-orphan-activity-anchor-locations.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const count = await deactivateOrphanActiveLocations();
  if (count === 0) {
    console.log('No orphan active locations to clean up.');
  }
});
