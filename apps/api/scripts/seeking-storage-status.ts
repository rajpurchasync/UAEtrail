/**
 * Ops readiness for activity-canonical seeking storage.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run seeking-storage-status
 *   npm --workspace @uaetrail/api run seeking-storage-status -- --strict
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { loadSeekingStorageStatus, seekingStorageStrictGateFails } from '../src/lib/seeking-storage-ops.js';

const strict = process.argv.includes('--strict');

const main = async () => {
  await connectMongo();
  const report = await loadSeekingStorageStatus();
  console.log(JSON.stringify(report, null, 2));

  if (strict && seekingStorageStrictGateFails(report)) {
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
