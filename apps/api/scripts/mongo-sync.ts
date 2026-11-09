/** Migrations + indexes + warn validators — same path as API `connectMongo()`. */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';

const run = async () => {
  await connectMongo();
  console.log('[mongo:sync] Migrations, indexes, and validators applied.');
  await disconnectMongo();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
