import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type { Express } from 'express';

const apiRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

let migrationsApplied = false;

export const configureTestEnv = (): void => {
  dotenv.config({ path: path.join(apiRoot, '.env') });
  process.env.NODE_ENV = 'test';
  process.env.PORT = '4001';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/uaetrail';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-test-access-secret';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-test-refresh-secret';
  process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5173';
  process.env.API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
  delete process.env.REDIS_URL;
};

export const applyTestMigrations = (): void => {
  if (migrationsApplied) return;
  configureTestEnv();
  execSync('npx prisma migrate deploy', {
    cwd: apiRoot,
    stdio: 'pipe',
    env: process.env as NodeJS.ProcessEnv
  });
  migrationsApplied = true;
};

export const bootstrapTestApp = async (): Promise<Express> => {
  applyTestMigrations();
  configureTestEnv();
  const { registerRateLimiters } = await import('../../src/middleware/rate-limit-instances.js');
  const { createRateLimiters } = await import('../../src/middleware/rate-limit.js');
  const { bootstrapApp } = await import('../../src/app.js');
  registerRateLimiters(await createRateLimiters());
  return bootstrapApp();
};
