/**
 * Ops readiness for seeking M2d (backfill + PARTICIPANT_INTENT_STUB_WRITE=false).
 *
 * Usage:
 *   npm --workspace @uaetrail/api run seeking-m2d-status
 *   npm --workspace @uaetrail/api run seeking-m2d-status -- --strict
 *
 * `--strict` exits 1 when backfill is incomplete or stub write is still enabled.
 */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { loadSeekingM2dStatus, seekingM2dStrictGateFails } from '../src/lib/seeking-m2d-ops.js';

const strict = process.argv.includes('--strict');

const main = async () => {
  await connectMongo();
  const report = await loadSeekingM2dStatus();
  console.log(JSON.stringify(report, null, 2));

  if (strict && seekingM2dStrictGateFails(report)) {
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
