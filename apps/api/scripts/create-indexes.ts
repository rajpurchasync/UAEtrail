/** Calls the same `ensureMongoIndexes` used on API connect. */
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { ensureMongoIndexes } from '../src/lib/mongo-indexes.js';

const run = async () => {
  const client = await connectMongo();
  await ensureMongoIndexes(client.db());
  await disconnectMongo();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
