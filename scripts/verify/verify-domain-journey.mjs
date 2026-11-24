#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';
import { buildSharedTypesWorkspace } from '../lib/ensure-shared-types-build.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

console.log('[verify:domain:journey]');
buildSharedTypesWorkspace(root, childEnv(), { logPrefix: 'verify:domain:journey' });
execSync(
  'npx vitest run src/member-plan/planHubInboundGuard.test.ts',
  { cwd: root, stdio: 'inherit', env: childEnv() }
);
execSync(
  'npm --workspace @uaetrail/api run test -- --run tests/member-journey-map-contract.test.ts tests/g-manage-coordination-join-approve.test.ts',
  { cwd: root, stdio: 'inherit', env: childEnv() }
);
console.log('[verify:domain:journey] OK');
