#!/usr/bin/env node
/**
 * Validates scripts/refactor-program.json against repo paths and Tier-1 spine.
 * Complete migrations: archivedAt only (no feRoots/apiRoots) — MIG-PROGRAM-ARCHIVE.
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
const programPath = join(root, 'scripts/refactor-program.json');
const coherencePath = join(root, 'docs/SYSTEM_COHERENCE.md');
const manifestPath = join(root, 'scripts/bounded-context-manifest.json');

let failed = false;

const fail = (msg) => {
  console.error(`[verify:refactor-program] ${msg}`);
  failed = true;
};

if (!existsSync(programPath)) {
  fail('missing scripts/refactor-program.json');
  process.exit(1);
}

const program = JSON.parse(readFileSync(programPath, 'utf8'));
const coherence = readFileSync(coherencePath, 'utf8');

if (!coherence.includes('### 8.6 Platform program')) {
  fail('docs/SYSTEM_COHERENCE.md missing §8.6 Platform program');
}

if (!coherence.includes('refactor-program.json')) {
  fail('docs/SYSTEM_COHERENCE.md must reference scripts/refactor-program.json');
}

const ctoLine =
  program.authorization?.statement ??
  'Program confirmed; P0–P1 complete; P2+ gated on S10e/f + migration WIP limit.';
if (!coherence.includes(ctoLine)) {
  fail('docs/SYSTEM_COHERENCE.md must include authorization.statement from refactor-program.json');
}

if (!existsSync(manifestPath)) {
  fail('missing scripts/bounded-context-manifest.json');
}

const maxWip = program.capacity?.maxInProgressMigrations ?? 2;
const inProgress = (program.migrations ?? []).filter((m) => m.status === 'in_progress');
if (inProgress.length > maxWip) {
  fail(
    `${inProgress.length} migrations in_progress (max ${maxWip}): ${inProgress.map((m) => m.id).join(', ')}`
  );
}

const phaseIds = new Set((program.phases ?? []).map((p) => p.id));
for (const migration of program.migrations ?? []) {
  if (!migration.id?.startsWith('MIG-')) {
    fail(`migration ${migration.id ?? '?'} must use MIG-* id`);
  }
  if (migration.phase && !phaseIds.has(migration.phase)) {
    fail(`migration ${migration.id} references unknown phase ${migration.phase}`);
  }

  if (migration.status === 'complete') {
    if (!migration.archivedAt) {
      fail(`complete migration ${migration.id}: missing archivedAt (run normalize-refactor-program-archive.mjs)`);
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

const gatedPhases = (program.phases ?? []).filter((p) => p.status === 'gated' || p.authorization === 'gated');
for (const phase of gatedPhases) {
  if (!['P2', 'P3', 'P4', 'P5', 'P6'].includes(phase.id)) {
    fail(`unexpected gated phase ${phase.id}`);
  }
}

if (failed) {
  console.error('\n[verify:refactor-program] FAILED');
  process.exit(1);
}

try {
  execSync(
    'npx vitest run src/config/programArchiveGuard.test.ts src/config/programPhaseOpsGuard.test.ts src/config/repoCensusGuard.test.ts',
    {
    cwd: root,
    stdio: 'inherit',
    env: childEnv(),
    }
  );
} catch {
  console.error('\n[verify:refactor-program] programArchiveGuard FAILED');
  process.exit(1);
}

console.log(
  `[verify:refactor-program] OK — ${program.phases?.length ?? 0} phases, ${program.migrations?.length ?? 0} migrations, ${inProgress.length}/${maxWip} WIP`
);