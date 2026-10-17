#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

console.log('[verify:domain:journey]');
execSync(
  'npx vitest run src/member-plan/tripsConsumerNamingGuard.test.ts',
  { cwd: root, stdio: 'inherit', env: childEnv() }
);
execSync(
  'npm --workspace @uaetrail/api run test -- --run tests/member-journey-map-contract.test.ts tests/g-manage-coordination-join-approve.test.ts',
  { cwd: root, stdio: 'inherit', env: childEnv() }
);
console.log('[verify:domain:journey] OK');
