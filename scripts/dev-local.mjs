import { spawn } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { printMobileDevHints } from './dev-network-preflight.mjs';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
dotenv.config({ path: path.join(rootDir, '.env') });
/** `dev:local` always targets Docker/local Mongo — not Atlas from MONGODB_URI_TEST. */
const localMongoUri =
  process.env.LOCAL_MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/uaetrail_dev';

const isTruthyEnv = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const isSeedDataRequested = () =>
  isTruthyEnv(process.env.SEED_DATA) ||
  isTruthyEnv(process.env.RUN_PROJECT_FORCE_SEED) ||
  isTruthyEnv(process.env.FORCE_SEED);

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

const startLocalMongo = async () => {
  console.log('[dev:local] Starting local MongoDB (Docker profile local-mongo)…');
  try {
    await run('docker', ['start', 'uaetrail-mongo-1']);
  } catch {
    // Container may not exist yet — create via compose (needs interpolated .env keys).
  }
  try {
    await run('docker', ['compose', '--profile', 'local-mongo', 'up', '-d', 'mongo'], {
      env: dockerComposeEnv(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[dev:local] Could not start Docker MongoDB (${message}).\n` +
        '  If MongoDB is already running locally, the dev stack will still start.\n' +
        '  Otherwise install Docker Desktop or point MONGODB_URI at Atlas in .env.'
    );
  }
};

const seedLocalDemoData = async (env) => {
  if (!isSeedDataRequested()) return;

  if (!process.env.DEMO_ACCOUNT_PASSWORD?.trim()) {
    console.warn(
      '[dev:local] SEED_DATA is set but DEMO_ACCOUNT_PASSWORD is missing — seed will fail.\n' +
        '  Add DEMO_ACCOUNT_PASSWORD=… to .env (see .env.example, docs/DEV_RUN.md).'
    );
    return;
  }

  console.log('[dev:local] SEED_DATA enabled — seeding demo data into local Mongo…');
  try {
    await run('npm', ['run', 'seed'], { env });
    console.log('[dev:local] Demo seed finished.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[dev:local] Demo seed failed (${message}). Stack will still start; retry: npm run seed`);
  }
};

const clearStaleTunnelUrl = () => {
  const tunnelFile = path.join(rootDir, '.dev-mobile-tunnel.url');
  try {
    if (existsSync(tunnelFile)) unlinkSync(tunnelFile);
  } catch {
    /* ignore */
  }
};

const main = async () => {
  clearStaleTunnelUrl();
  await startLocalMongo();

  const env = {
    ...process.env,
    MONGODB_URI: localMongoUri,
    RUN_ENV: process.env.RUN_ENV ?? 'test',
  };

  await seedLocalDemoData(env);

  console.log(`[dev:local] Starting Vite + API with MONGODB_URI=${localMongoUri}`);
  if (!isSeedDataRequested()) {
    console.log(
      '[dev:local] Explore map sparse?  Set SEED_DATA=true in .env (and DEMO_ACCOUNT_PASSWORD), or run SEED_DATA=true npm run seed'
    );
  }
  console.log(
    '[dev:local] After Find changes: npm run test:seeking-local  — manual smoke: docs/DEV_RUN.md § Find'
  );
  printMobileDevHints(5175);

  await run('npm', ['run', 'dev:all'], { env });
};

main().catch((error) => {
  console.error('[dev:local] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
