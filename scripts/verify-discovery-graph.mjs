#!/usr/bin/env node
/**
 * DMCP Phase 3 — discovery projection import graph + list/explore facade budget.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:discovery-graph] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

try {
  run('import audit (regenerate + budget)', 'npm run discovery:import-audit');
  run(
    'guards',
    'npx vitest run src/config/discoveryGraphGuard.test.ts src/list/listModuleHygiene.test.ts src/config/crossContextFoundationsGuard.test.ts'
  );
  console.log('\n[verify:discovery-graph] OK');
} catch (error) {
  console.error('\n[verify:discovery-graph] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}