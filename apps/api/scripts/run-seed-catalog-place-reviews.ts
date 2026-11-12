import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { seedCatalogPlaceReviews } from '../src/lib/seed-catalog-place-reviews.js';

const main = async () => {
  await connectMongo();
  const result = await seedCatalogPlaceReviews();
  await invalidateExploreMapCache();
  console.log(
    `[seed:catalog-place-reviews] places=${result.places} shops=${result.shops} inserted=${result.inserted} updated=${result.updated} skipped=${result.skipped} (explore map cache cleared)`
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
  });
