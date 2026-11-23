/**
 * Start local MongoDB (Docker profile local-mongo). Windows-friendly.
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

const dockerComposeEnv = () => ({
  ...process.env,
  MONGODB_URI: localMongoUri,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID?.trim() || 'local-dev',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY?.trim() || 'local-dev-secret',
});

const main = async () => {
  try {
    await run('docker', ['start', 'uaetrail-mongo-1']);
  } catch {
    // container may not exist yet
  }

  await run('docker', ['compose', '--profile', 'local-mongo', 'up', '-d', 'mongo'], {
    env: dockerComposeEnv(),
  });

  console.log(`[db:local:up] MongoDB listening on ${localMongoUri}`);
  console.log('[db:local:up] Next: npm run db:local:migrate  →  npm run db:seed:dev');
};

main().catch((error) => {
  console.error('[db:local:up] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
