#!/usr/bin/env node
/**
 * One-shot / maintenance: strip feRoots·apiRoots·executionPhases from complete MIG-* rows.
 * Path truth → bounded-context-manifest.json + program *-touchpoints.json + guards.
 * @see MIG-PROGRAM-ARCHIVE · verify-platform-program.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const programPath = join(root, 'scripts/platform-program.json');
const ARCHIVED_AT = '2026-11-23';

/** Optional machine schedule when not already on the row */
const SCHEDULE_DOC_BY_ID = {
  'MIG-PEOPLE-VOCAB-2026': 'scripts/people-vocabulary-touchpoints.json',
  'MIG-PLATFORM-COMPOSE-OPERATOR-2026': 'npm run verify:compose-spine',
  'MIG-ROUTING-CANON-P0': 'scripts/routing-canonical-map.json',
};

const program = JSON.parse(readFileSync(programPath, 'utf8'));
let touched = 0;

for (const migration of program.migrations ?? []) {
  if (migration.status !== 'complete') continue;

  const hadRoots =
    (migration.feRoots?.length ?? 0) > 0 ||
    (migration.apiRoots?.length ?? 0) > 0 ||
    (migration.executionPhases?.length ?? 0) > 0;

  delete migration.feRoots;
  delete migration.apiRoots;
  delete migration.executionPhases;

  if (!migration.archivedAt) migration.archivedAt = ARCHIVED_AT;

  if (!migration.scheduleDoc && SCHEDULE_DOC_BY_ID[migration.id]) {
    migration.scheduleDoc = SCHEDULE_DOC_BY_ID[migration.id];
  }

  if (typeof migration.successMetric === 'string' && migration.successMetric.length > 200) {
    if (migration.scheduleDoc) {
      migration.successMetric = `Closed — ${migration.scheduleDoc}`;
    } else {
      migration.successMetric = `${migration.successMetric.slice(0, 197)}…`;
    }
  }

  if (hadRoots || !migration.archivedAt) touched += 1;
}

const archiveId = 'MIG-PROGRAM-ARCHIVE';
if (!program.migrations.some((m) => m.id === archiveId)) {
  program.migrations.push({
    id: archiveId,
    phase: 'P4b',
    status: 'complete',
    owner: 'platform',
    contextIds: [],
    archivedAt: ARCHIVED_AT,
    scheduleDoc: 'scripts/program-normalize-archive.mjs',
    successMetric:
      'Complete migrations: archivedAt, no feRoots/apiRoots; WIP rows keep paths; verify:platform-program enforces.',
  });
  touched += 1;
}

program.description =
  'Platform program spine (index). Complete MIG-* rows archived — paths in manifest + touchpoints JSON, not here.';
program.updated = ARCHIVED_AT;

writeFileSync(programPath, `${JSON.stringify(program, null, 2)}\n`, 'utf8');
console.log(`[program-normalize-archive] updated platform-program.json (${touched} migration touch/es)`);