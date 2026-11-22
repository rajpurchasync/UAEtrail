#!/usr/bin/env node
/**
 * Scoped `tsc.app` gate — list browse shell + explore experience shell only.
 * Full app typecheck remains `npm run typecheck` (CI).
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCOPED_PREFIXES = ['src/list/', 'src/explore/shell/'];

const runTypecheck = () => {
  try {
    execSync('npx tsc --noEmit -p tsconfig.app.json', {
      cwd: root,
      encoding: 'utf8',
      env: stripNpmDevdirEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return '';
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    return `${stdout}\n${stderr}`;
  }
};

const output = runTypecheck();
const scoped = output
  .split(/\r?\n/)
  .filter((line) => line.includes('error TS'))
  .filter((line) => SCOPED_PREFIXES.some((prefix) => line.includes(prefix)));

if (scoped.length === 0) {
  console.log('[typecheck:consumer-shell] OK — list + explore shell clean');
  process.exit(0);
}

console.error('[typecheck:consumer-shell] FAILED — fix list / explore shell types:\n');
for (const line of scoped) console.error(line);
process.exit(1);