#!/usr/bin/env node
/**
 * DMCP Phase 4 — compose spine (wire + wizards + plan handoff).
 * Program: MIG-PLATFORM-COMPOSE-OPERATOR-2026 → target emit activity|place|intent.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const matrix = JSON.parse(readFileSync(join(root, 'scripts/governance/authority-matrix.json'), 'utf8'));
const composeActions = (matrix.actions ?? []).filter((a) => a.id?.startsWith('compose.'));
console.log('[verify:compose-spine] scorecard');
console.log(`  authority-matrix compose rows: ${composeActions.length}`);
console.log(`  readCompat choke points: ${(matrix.readCompatChokePoints ?? []).length}`);

// FE guards run once via verify:domain:fe inside verify:system — scorecard + scheduleDoc anchor (GW-3).
console.log('\n[verify:compose-spine] OK (FE guards: npm run verify:domain:fe · npm run verify:system)');