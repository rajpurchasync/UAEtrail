import { backfillSeedCatalogLocationDestinationIds } from './seed-location-area-map.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

const main = async () => {
  await backfillSeedCatalogLocationDestinationIds();
  console.log('backfillSeedCatalogLocationDestinationIds done');
};

runCliScript(resolveCliScriptName(import.meta.url), main);