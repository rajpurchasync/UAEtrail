#!/usr/bin/env node
/**
 * DMCP Phase 8 — release ops spine (S10e/S10f, P5 SLO, MIG-DISCO-REG wiring).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:release-ops] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/authority-matrix.json'), 'utf8'));
console.log('[verify:release-ops] scorecard');
console.log(`  dmcpPhase: ${matrix.dmcpPhase ?? 'unknown'}`);

// Release ops vitest guards run via verify:domain:fe (GW-3).
try {
  run('Release ops wiring smoke', 'npm run release:ops:checklist');
  run('P5 SLO preflight (eng)', 'npm run p5:slo-preflight');
  console.log('\n[verify:release-ops] OK (staging S10f/S10e/MIG migrate remain human)');
} catch (error) {
  console.error('\n[verify:release-ops] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}