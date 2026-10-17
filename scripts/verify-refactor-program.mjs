#!/usr/bin/env node
/**
 * Validates scripts/refactor-program.json against repo paths and Tier-1 spine.
 * @see docs/SYSTEM_COHERENCE.md §8.6
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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
  for (const rel of [...(migration.feRoots ?? []), ...(migration.apiRoots ?? [])]) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      fail(`migration ${migration.id}: missing path ${rel}`);
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

console.log(
  `[verify:refactor-program] OK — ${program.phases?.length ?? 0} phases, ${program.migrations?.length ?? 0} migrations, ${inProgress.length}/${maxWip} WIP`
);
