#!/usr/bin/env node
/**
 * DMCP Phase 2 — one catalog truth (availability find crew; no seeking/demand product paths).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';
import { buildSharedTypesWorkspace } from '../lib/ensure-shared-types-build.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:catalog-truth] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/governance/authority-matrix.json'), 'utf8'));
const findCrew = (matrix.actions ?? []).filter((a) =>
  /^availability\.|^discover\.map_/.test(a.id)
);
console.log('[verify:catalog-truth] scorecard');
console.log(`  map/find-crew matrix rows: ${findCrew.length}`);
console.log(
  `  legacy.seeking_map_product retired: ${Boolean(
    (matrix.actions ?? []).find((a) => a.id === 'legacy.seeking_map_product')?.retired
  )}`
);

try {
  run(
    'FE lineage + pin hygiene',
    'npx vitest run src/config/catalogTruthGuard.test.ts src/config/memberAvailabilityLineageGuard.test.ts src/config/seekingPinHygieneGuard.test.ts'
  );
  buildSharedTypesWorkspace(root, childEnv(), { logPrefix: 'verify:catalog-truth' });
  run(
    'API map + intent residue',
    'npm --workspace @uaetrail/api run test -- --run tests/data-source-coherence-guard.test.ts tests/participant-intent-m2-guards.test.ts tests/explore-seeking-activities-contract.test.ts tests/participant-intent-seeking-dual-write.test.ts tests/explore-map-seeking-discoverability.test.ts tests/participant-intent-residue-guard.test.ts'
  );
  console.log('\n[verify:catalog-truth] OK');
} catch (error) {
  console.error('\n[verify:catalog-truth] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}