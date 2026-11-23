#!/usr/bin/env node
/**
 * DMCP Phase 5 — participation join spine + activity L3 presentation + S10f program bridge.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:participation-spine] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/governance/authority-matrix.json'), 'utf8'));
const participate = (matrix.actions ?? []).filter((a) => a.axis === 'D_PARTICIPATE');
console.log('[verify:participation-spine] scorecard');
console.log(`  D_PARTICIPATE matrix rows: ${participate.length}`);
console.log(`  dmcpPhase: ${matrix.dmcpPhase ?? 'unknown'}`);

// FE participation guards run via verify:domain:fe (GW-3).
try {
  run(
    'API participation contracts',
    'npm --workspace @uaetrail/api run test -- --run tests/activity-rsvp-flow.test.ts tests/activity-participation-mode.test.ts tests/member-discovery-contract.test.ts tests/activity-engagement-policy-input.test.ts'
  );
  console.log('\n[verify:participation-spine] OK');
} catch (error) {
  console.error('\n[verify:participation-spine] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}