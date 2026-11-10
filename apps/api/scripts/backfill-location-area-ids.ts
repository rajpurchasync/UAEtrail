import { backfillSeedCatalogLocationAreaIds } from './seed-location-area-map.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  await backfillSeedCatalogLocationAreaIds();
  console.log('backfillSeedCatalogLocationAreaIds done');
});
