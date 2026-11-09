/**
 * Full demo seed against local Docker Mongo — migrations run via connect on seed/API.
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
  if (!process.env.DEMO_ACCOUNT_PASSWORD?.trim()) {
    console.error(
      '[db:seed:dev] Set DEMO_ACCOUNT_PASSWORD in root .env before seed (demo-login + seeded users).'
    );
    process.exit(1);
  }

  console.log(`[db:seed:dev] Seeding ${localMongoUri} (SEED_DATA=true, SEED_DEV_RICH=1)`);
  await run('npm', ['run', 'seed'], {
    env: {
      ...process.env,
      MONGODB_URI: localMongoUri,
      RUN_ENV: process.env.RUN_ENV ?? 'local',
      NODE_ENV: process.env.NODE_ENV ?? 'development',
      SEED_DATA: 'true',
      SEED_DEV_RICH: '1',
    },
  });
  console.log('[db:seed:dev] Done. Start stack: npm run dev:local');
};

main().catch((error) => {
  console.error('[db:seed:dev] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
