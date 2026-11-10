/** Calls the same `ensureMongoIndexes` used on API connect. */
import { getMongoClient } from '../src/lib/mongo.js';
import { ensureMongoIndexes } from '../src/lib/mongo-indexes.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  await ensureMongoIndexes(getMongoClient()!.db());
  console.log('[create-indexes] Mongo indexes ensured.');
});
