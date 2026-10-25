import { connectMongo } from '../src/lib/mongo.js';
import { backfillSeedCatalogLocationAreaIds } from './seed-location-area-map.js';

await connectMongo();
await backfillSeedCatalogLocationAreaIds();
console.log('backfillSeedCatalogLocationAreaIds done');
process.exit(0);
