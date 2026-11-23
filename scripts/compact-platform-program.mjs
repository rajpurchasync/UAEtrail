#!/usr/bin/env node
/**
 * GW-1 — compact platform-program migration ledger (no successMetric / contextIds noise).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const programPath = join(dirname(fileURLToPath(import.meta.url)), 'platform-program.json');
const program = JSON.parse(readFileSync(programPath, 'utf8'));
const KEEP_SCHEDULE = new Set([
  'MIG-PLATFORM-LAYER-SPINE',
  'MIG-DISCOVER-RECOMMENDATIONS',
  'MIG-PEOPLE-VOCAB-2026',
  'MIG-PLATFORM-COMPOSE-OPERATOR-2026',
  'MIG-SCHEDULE-GUIDE',
]);

const compact = (program.migrations ?? [])
  .filter((m) => m.id !== 'MIG-PROGRAM-ARCHIVE')
  .map((m) => {
    const row = {
      id: m.id,
      status: m.status,
      ...(m.phase ? { phase: m.phase } : {}),
    };
    if (m.status === 'complete') {
      row.archivedAt = m.archivedAt ?? '2026-11-23';
    }
    const sched = m.scheduleDoc ?? (KEEP_SCHEDULE.has(m.id) ? undefined : undefined);
    if (m.scheduleDoc) row.scheduleDoc = m.scheduleDoc;
    else if (m.id === 'MIG-PLATFORM-COMPOSE-OPERATOR-2026') {
      row.scheduleDoc = 'npm run verify:compose-spine';
    } else if (m.id === 'MIG-PEOPLE-VOCAB-2026') {
      row.scheduleDoc = 'scripts/people-vocabulary-touchpoints.json';
    }
    return row;
  });

program.migrations = compact;
program.archivePolicy =
  'Complete rows: id, phase, status, archivedAt, optional scheduleDoc. Contracts: bounded-context-manifest.json + *-touchpoints.json.';
program.cleanupWave = 'GW-1-governance-surface';
program.stranglerRules = [
  'Work by bounded context id (scripts/bounded-context-manifest.json).',
  'New in_progress MIG row: id + phase + feRoots/apiRoots until close; then compact via scripts/compact-platform-program.mjs.',
  'At most maxInProgressMigrations in_progress.',
];
writeFileSync(programPath, `${JSON.stringify(program, null, 2)}\n`, 'utf8');
console.log(`[compact-platform-program] ${compact.length} migrations`);