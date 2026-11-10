/**
 * Seed geo tree (country → state → area → venue) and attach geoRef through area
 * on locations, activities, and facilities. Facilities also get venueId / parentPlaceId.
 *
 *   npm --workspace @uaetrail/api run backfill-geo-hierarchy
 */
import { getMongoClient } from '../src/lib/mongo.js';
import { enrichGeoHierarchy } from '../src/lib/geo-backfill.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const result = await enrichGeoHierarchy(getMongoClient()!.db());
  console.log(JSON.stringify(result, null, 2));
});
