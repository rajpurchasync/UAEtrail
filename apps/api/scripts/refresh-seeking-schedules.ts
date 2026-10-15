/**
 * Sync active participant-intent dates → linked `activityMode: seeking` rows.
 * Rolls past intent dates forward so map / Find crew / list stay populated.
 *
 * Usage: npm --workspace @uaetrail/api run refresh-seeking-schedules
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { refreshActiveParticipantSeekingSchedules } from './seed-demo-seeking-schedules.js';

const main = async () => {
  await connectMongo();
  const result = await refreshActiveParticipantSeekingSchedules();
  console.log(
    `Seeking schedule refresh: updated=${result.updated} rolledForward=${result.rolledForward}`
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
