import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { disconnectRedis } from '../src/lib/redis.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { ensureFacilityParentPlaces, seedCatalogFacilities } from './seed-catalog-facilities.js';
import { seedCuratedAreas } from '../src/lib/seed-areas.js';

const main = async () => {
  await connectMongo();
  await seedCuratedAreas();
  const stubs = await ensureFacilityParentPlaces();
  const result = await seedCatalogFacilities();
  await invalidateExploreMapCache();
  console.log(
    `[seed:catalog-facilities] place-stubs=${stubs} upserted=${result.upserted} skipped=${result.skipped} (explore map cache cleared)`
  );
  console.log('Try: /explore?area=hatta — open Hatta Dam Loop /place/hatta-dam-loop for nearby facilities.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
    await disconnectRedis();
  });
