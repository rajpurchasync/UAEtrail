/**
 * Refresh demo explore activities (dates + rideshare car snapshot on seed rides).
 *
 * Usage: npm --workspace @uaetrail/api run ensure-demo-explore-activities
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { disconnectRedis } from '../src/lib/redis.js';
import { ensureDemoExploreActivities } from './seed-demo-scheduled-activities.js';

const main = async () => {
  await connectMongo();
  const ok = await ensureDemoExploreActivities();
  if (!ok) {
    process.exitCode = 1;
    console.error(
      '[seed] ensure failed — run full seed (SEED_DATA=true npm run seed) if demo users are missing'
    );
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
    await disconnectRedis();
    process.exit(process.exitCode ?? 0);
  });
