/**
 * Apply Mongo migrations + indexes to LOCAL_MONGODB_URI (same as API connect).
 */
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const mongoPort = process.env.MONGO_PORT?.trim() || '27017';
const localMongoUri =
  process.env.LOCAL_MONGODB_URI?.trim() || `mongodb://127.0.0.1:${mongoPort}/uaetrail_dev`;

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });

const main = async () => {
  console.log(`[db:local:migrate] MONGODB_URI=${localMongoUri}`);
  await run('npm', ['--workspace', '@uaetrail/api', 'run', 'mongo:sync'], {
    env: {
      ...process.env,
      MONGODB_URI: localMongoUri,
      RUN_ENV: process.env.RUN_ENV ?? 'local',
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
  });
};

main().catch((error) => {
  console.error('[db:local:migrate] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
