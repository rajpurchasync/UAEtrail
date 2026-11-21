#!/usr/bin/env node
/**
 * DMCP Phase 4 — Host · Availability · Add compose spine (wire + wizards + plan handoff).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:compose-spine] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/authority-matrix.json'), 'utf8'));
const composeActions = (matrix.actions ?? []).filter((a) => a.id?.startsWith('compose.'));
console.log('[verify:compose-spine] scorecard');
console.log(`  authority-matrix compose rows: ${composeActions.length}`);
console.log(`  readCompat choke points: ${(matrix.readCompatChokePoints ?? []).length}`);

try {
  run(
    'FE compose guards',
    'npx vitest run src/config/composeSpineGuard.test.ts src/config/composeLineageGuard.test.ts src/explore/create/createFlowModuleGuard.test.ts'
  );
  run(
    'shared-types compose wire',
    'npx vitest run packages/shared-types/src/compose-route.test.ts'
  );
  console.log('\n[verify:compose-spine] OK');
} catch (error) {
  console.error('\n[verify:compose-spine] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}