import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

await connectMongo();
await invalidateExploreMapCache();
console.log('[explore-map] Cache invalidated.');
await disconnectMongo();
