#!/usr/bin/env node
/**
 * W1 — run seeking:deploy-gate against local Docker Mongo (not Atlas from .env).
 *
 * Usage: npm run w1:local-gate
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

const child = spawn('npm', ['run', 'seeking:deploy-gate'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    MONGODB_URI: localMongoUri,
  },
});

child.on('exit', (code) => process.exit(code ?? 1));