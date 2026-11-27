#!/usr/bin/env node
/**
 * A-SEEK ops — per-environment seeking storage sign-off (gate + purge dry-run).
 * Uses MONGODB_URI from env (or .env). Local Docker: npm run w1:local-gate first.
 *
 * Usage: npm run a-seek:ops-check
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const run = (label, args) => {
  console.log(`\n[a-seek:ops-check] ${label}`);
  const result = spawnSync('npm', args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`[a-seek:ops-check] FAILED at ${label}`);
    process.exit(result.status ?? 1);
  }
};

run('strict deploy gate', ['run', 'seeking:deploy-gate']);
run('purge dry-run', ['run', 'purge:seeking-legacy', '--', '--dry-run']);

console.log(
  '\n[a-seek:ops-check] OK — storage gate + purge dry-run. If dry-run counts are 0, run purge for real, then deploy (migration 2025112509 drops empty collections).'
);