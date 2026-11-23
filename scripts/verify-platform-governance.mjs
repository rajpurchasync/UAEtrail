#!/usr/bin/env node
/**
 * Platform governance — ops phases, WIP, touchpoint registry (GW-4).
 * Closed MIG ledger: scripts/platform-migration-archive.json
 * @see docs/SYSTEM_COHERENCE.md §8.6
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const governancePath = join(root, 'scripts/platform-governance.json');
const archivePath = join(root, 'scripts/platform-migration-archive.json');
const registryPath = join(root, 'scripts/platform-touchpoint-registry.json');
const coherencePath = join(root, 'docs/SYSTEM_COHERENCE.md');
const manifestPath = join(root, 'scripts/bounded-context-manifest.json');

let failed = false;

const fail = (msg) => {
  console.error(`[verify:platform-governance] ${msg}`);
  failed = true;
};

if (!existsSync(governancePath)) {
  fail('missing scripts/platform-governance.json');
  process.exit(1);
}
if (!existsSync(archivePath)) {
  fail('missing scripts/platform-migration-archive.json');
  process.exit(1);
}
if (!existsSync(registryPath)) {
  fail('missing scripts/platform-touchpoint-registry.json');
  process.exit(1);
}
if (existsSync(join(root, 'scripts/platform-program.json'))) {
  fail('retired scripts/platform-program.json must be removed (GW-4)');
}

const governance = JSON.parse(readFileSync(governancePath, 'utf8'));
const archive = JSON.parse(readFileSync(archivePath, 'utf8'));
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const coherence = readFileSync(coherencePath, 'utf8');

if (!coherence.includes('### 8.6 Platform program')) {
  fail('docs/SYSTEM_COHERENCE.md missing §8.6 Platform program');
}

if (!coherence.includes('platform-governance.json')) {
  fail('docs/SYSTEM_COHERENCE.md must reference scripts/platform-governance.json');
}

const ctoLine =
  governance.authorization?.statement ??
  'Program confirmed; P0–P1 complete; P2+ gated on S10e/f + migration WIP limit.';
if (!coherence.includes(ctoLine)) {
  fail('docs/SYSTEM_COHERENCE.md must include authorization.statement from platform-governance.json');
}

if (!existsSync(manifestPath)) {
  fail('missing scripts/bounded-context-manifest.json');
}

const maxWip = governance.capacity?.maxInProgressMigrations ?? 2;
const inProgress = (archive.migrations ?? []).filter((m) => m.status === 'in_progress');
if (inProgress.length > maxWip) {
  fail(
    `${inProgress.length} migrations in_progress (max ${maxWip}): ${inProgress.map((m) => m.id).join(', ')}`
  );
}

const phaseIds = new Set((governance.phases ?? []).map((p) => p.id));
for (const migration of archive.migrations ?? []) {
  if (!migration.id?.startsWith('MIG-')) {
    fail(`migration ${migration.id ?? '?'} must use MIG-* id`);
  }
  if (migration.phase && !phaseIds.has(migration.phase)) {
    fail(`migration ${migration.id} references unknown phase ${migration.phase}`);
  }

  if (migration.status === 'complete') {
    if (!migration.archivedAt) {
      fail(`complete migration ${migration.id}: missing archivedAt`);
    }
    if (migration.feRoots?.length) {
      fail(`complete migration ${migration.id}: feRoots not allowed after archive`);
    }
    if (migration.apiRoots?.length) {
      fail(`complete migration ${migration.id}: apiRoots not allowed after archive`);
    }
    if (migration.executionPhases?.length) {
      fail(`complete migration ${migration.id}: executionPhases not allowed after archive`);
    }
    continue;
  }

  if (migration.status === 'in_progress' || migration.status === 'planned') {
    for (const rel of [...(migration.feRoots ?? []), ...(migration.apiRoots ?? [])]) {
      const abs = join(root, rel);
      if (!existsSync(abs)) {
        fail(`migration ${migration.id}: missing path ${rel}`);
      }
    }
  }
}

for (const row of registry.programs ?? []) {
  if (!row.programId?.startsWith('MIG-')) {
    fail(`registry row missing MIG-* programId`);
  }
  if (!row.scheduleDoc) {
    fail(`registry ${row.programId}: missing scheduleDoc`);
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
    'npx vitest run src/config/programArchiveGuard.test.ts src/config/programPhaseOpsGuard.test.ts src/config/repoCensusGuard.test.ts src/config/platformProgramNamingGuard.test.ts src/config/governanceSurfaceGuard.test.ts src/config/platformTouchpointRegistryGuard.test.ts',
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
  `[verify:platform-governance] OK — ${governance.phases?.length ?? 0} phases, ${archive.migrations?.length ?? 0} archived MIGs, ${registry.programs?.length ?? 0} registry row(s), ${inProgress.length}/${maxWip} WIP`
);