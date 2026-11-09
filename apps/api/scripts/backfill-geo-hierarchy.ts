/**
 * Seed geo tree (country → state → area → venue) and attach geoRef through area
 * on locations, activities, and facilities. Facilities also get venueId / parentPlaceId.
 *
 *   npm --workspace @uaetrail/api run backfill-geo-hierarchy
 */
import { connectMongo, disconnectMongo, getMongoClient } from '../src/lib/mongo.js';
import { disconnectRedis } from '../src/lib/redis.js';
import { enrichGeoHierarchy } from '../src/lib/geo-backfill.js';

const closeWithTimeout = async (label: string, task: Promise<void>, ms = 8_000) => {
  await Promise.race([
    task.catch((err) => {
      console.warn(`[backfill-geo-hierarchy] ${label} failed:`, err instanceof Error ? err.message : err);
    }),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
};

await connectMongo();
try {
  const result = await enrichGeoHierarchy(getMongoClient().db());
  console.log(JSON.stringify(result, null, 2));
} finally {
  await closeWithTimeout('mongo close', disconnectMongo());
  await closeWithTimeout('redis close', disconnectRedis());
}
process.exit(0);
