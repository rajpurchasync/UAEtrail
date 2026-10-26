import { connectMongo } from '../src/lib/mongo.js';
import { deactivateOrphanActiveLocations } from './cleanup-orphan-activity-anchor-locations.js';

await connectMongo();
const count = await deactivateOrphanActiveLocations();
if (count === 0) {
  console.log('No orphan active locations to clean up.');
}
process.exit(0);
