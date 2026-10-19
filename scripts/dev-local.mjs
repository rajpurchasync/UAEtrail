import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
dotenv.config({ path: path.join(rootDir, '.env') });
/** `dev:local` always targets Docker/local Mongo — not Atlas from MONGODB_URI_TEST. */
const localMongoUri =
  process.env.LOCAL_MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/uaetrail_dev';

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

const startLocalMongo = async () => {
  console.log('[dev:local] Starting local MongoDB (Docker profile local-mongo)…');
  try {
    await run('docker', ['compose', '--profile', 'local-mongo', 'up', '-d', 'mongo']);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[dev:local] Could not start Docker MongoDB (${message}).\n` +
        '  If MongoDB is already running locally, the dev stack will still start.\n' +
        '  Otherwise install Docker Desktop or point MONGODB_URI at Atlas in .env.'
    );
  }
};

const main = async () => {
  await startLocalMongo();

  console.log(`[dev:local] Starting Vite + API with MONGODB_URI=${localMongoUri}`);
  console.log(
    '[dev:local] Explore map sparse?  npm run seed  (refreshes demo activity dates) or SEED_DATA=true npm run seed for full reseed'
  );
  console.log(
    '[dev:local] After Find changes: npm run test:seeking-local  — manual smoke: docs/DEV_RUN.md § Find'
  );
  const env = {
    ...process.env,
    MONGODB_URI: localMongoUri,
    RUN_ENV: process.env.RUN_ENV ?? 'test',
  };

  await run('npm', ['run', 'dev:all'], { env });
};

main().catch((error) => {
  console.error('[dev:local] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
