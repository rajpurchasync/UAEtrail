import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { ensureFacilityParentPlaces, seedCatalogFacilities } from './seed-catalog-facilities.js';
import { seedCuratedAreas } from '../src/lib/seed-areas.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  await seedCuratedAreas();
  const stubs = await ensureFacilityParentPlaces();
  const result = await seedCatalogFacilities();
  await invalidateExploreMapCache();
  console.log(
    `[seed:catalog-facilities] place-stubs=${stubs} upserted=${result.upserted} skipped=${result.skipped} (explore map cache cleared)`
  );
  console.log('Try: /explore?area=hatta — open Hatta Dam Loop /place/hatta-dam-loop for nearby facilities.');
});
