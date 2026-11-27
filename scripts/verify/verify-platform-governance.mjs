#!/usr/bin/env node
/**
 * Platform governance — ops phases, WIP, touchpoint registry (GW-4).
 * Closed MIG ledger retired (guards + manifest only).
 * @see docs/SYSTEM_COHERENCE.md §8.6
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const governancePath = join(root, 'scripts/governance/platform-governance.json');
const archivePath = join(root, 'scripts/governance/platform-migration-archive.json');
const registryPath = join(root, 'scripts/governance/platform-touchpoint-registry.json');
const coherencePath = join(root, 'docs/SYSTEM_COHERENCE.md');
const manifestPath = join(root, 'scripts/governance/bounded-context-manifest.json');

let failed = false;

const fail = (msg) => {
  console.error(`[verify:platform-governance] ${msg}`);
  failed = true;
};

if (!existsSync(governancePath)) {
  fail('missing scripts/governance/platform-governance.json');
  process.exit(1);
}
if (existsSync(archivePath)) {
  fail('scripts/governance/platform-migration-archive.json must not exist (retired ledger)');
}
if (!existsSync(registryPath)) {
  fail('missing scripts/governance/platform-touchpoint-registry.json');
  process.exit(1);
}
if (existsSync(join(root, 'scripts/platform-program.json'))) {
  fail('retired scripts/platform-program.json must be removed (GW-4)');
}

const governance = JSON.parse(readFileSync(governancePath, 'utf8'));
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const coherence = readFileSync(coherencePath, 'utf8');

if (!coherence.includes('### 8.6 Platform program')) {
  fail('docs/SYSTEM_COHERENCE.md missing §8.6 Platform program');
}

if (!coherence.includes('platform-governance.json')) {
  fail('docs/SYSTEM_COHERENCE.md must reference scripts/governance/platform-governance.json');
}

const ctoLine =
  governance.authorization?.statement ??
  'Program confirmed; P0–P1 complete; P2+ gated on S10e/f + migration WIP limit.';
if (!coherence.includes(ctoLine)) {
  fail('docs/SYSTEM_COHERENCE.md must include authorization.statement from platform-governance.json');
}

if (!existsSync(manifestPath)) {
  fail('missing scripts/governance/bounded-context-manifest.json');
}

const maxWip = governance.capacity?.maxInProgressMigrations ?? 2;
const inProgressFromRegistry = (registry.programs ?? []).filter((p) => p.status === 'in_progress');
if (inProgressFromRegistry.length > maxWip) {
  fail(
    `${inProgressFromRegistry.length} in-flight programs in registry (max ${maxWip}): ${inProgressFromRegistry.map((m) => m.programId).join(', ')}`
  );
}

for (const row of registry.programs ?? []) {
  if (!row.programId?.startsWith('MIG-')) {
    fail(`registry row missing MIG-* programId`);
  }
  if (!row.scheduleDoc) {
    fail(`registry ${row.programId}: missing scheduleDoc`);
  }
  if (row.scheduleDoc.endsWith('.json') && !existsSync(join(root, row.scheduleDoc))) {
    fail(`registry ${row.programId}: missing schedule file ${row.scheduleDoc}`);
  }
}

const gatedPhases = (governance.phases ?? []).filter((p) => p.status === 'gated' || p.authorization === 'gated');
for (const phase of gatedPhases) {
  if (!['P2', 'P3', 'P4', 'P5', 'P6'].includes(phase.id)) {
    fail(`unexpected gated phase ${phase.id}`);
  }
}

if (failed) {
  console.error('\n[verify:platform-governance] FAILED');
  process.exit(1);
}

try {
  execSync(
    'npx vitest run src/config/governanceLedgerRetiredGuard.test.ts src/config/programPhaseOpsGuard.test.ts src/config/repoCensusGuard.test.ts src/config/platformProgramNamingGuard.test.ts src/config/governanceSurfaceGuard.test.ts src/config/platformTouchpointRegistryGuard.test.ts',
    {
      cwd: root,
      stdio: 'inherit',
      env: childEnv(),
    }
  );
} catch {
  console.error('\n[verify:platform-governance] program guards FAILED');
  process.exit(1);
}

console.log(
  `[verify:platform-governance] OK — ${governance.phases?.length ?? 0} phases, ${registry.programs?.length ?? 0} registry row(s), ${inProgressFromRegistry.length}/${maxWip} WIP`
);