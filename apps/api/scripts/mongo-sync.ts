/** Migrations + indexes + warn validators — same path as API `connectMongo()`. */
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  console.log('[mongo:sync] Migrations, indexes, and validators applied.');
});
