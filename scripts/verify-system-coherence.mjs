#!/usr/bin/env node
/**
 * System-wide coherence — single entry for alignment work (not host-only or Tier-1-only).
 * @see docs/SYSTEM_COHERENCE.md §3 · docs/DOCS_GOVERNANCE.md
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:system] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const quick = process.argv.includes('--quick');

const steps = [
  ['Node/npm engines', 'npm run verify:engines'],
  ['Tier-1 docs', 'npm run verify:docs'],
  ['Platform governance spine', 'npm run verify:platform-governance'],
  ['Authority matrix (DMCP Phase 0)', 'npm run verify:authority-matrix'],
  ['Catalog truth (DMCP Phase 2)', 'npm run verify:catalog-truth'],
  ['Discovery graph (DMCP Phase 3)', 'npm run verify:discovery-graph'],
  ['Domain + routing + naming guards', 'npm run verify:domain'],
  ['Compose spine (DMCP Phase 4)', 'npm run verify:compose-spine'],
  ['Participation spine (DMCP Phase 5)', 'npm run verify:participation-spine'],
  ['Storefront spine (DMCP Phase 6)', 'npm run verify:storefront-spine'],
  ['People graph & plan (DMCP Phase 7)', 'npm run verify:people-graph-plan'],
  ['Platform layer spine (PLS)', 'npm run verify:platform-layer-spine'],
  ['Discover recommendations (REC)', 'npm run verify:discover-recommendations'],
  ['Release ops (DMCP Phase 8)', 'npm run verify:release-ops'],
  ['CTO system audit (W0)', 'npm run verify:system-audit'],
  ['Detail bundle / lazy-map graph', 'npm run verify:perf'],
  ['Host/member contracts', 'npm run verify:host-member'],
  ['List + explore shell types', 'npm run typecheck:consumer-shell'],
  [
    'Doc coherence (Tier 1 + experiment)',
    'npx vitest run src/content/docCoherence.test.ts',
  ],
];

if (!quick) {
  steps.push(['Explore alignment (bounded contexts)', 'npm run test:explore-alignment']);
}

try {
  for (const [label, command] of steps) {
    run(label, command);
  }
  console.log('\n[verify:system] OK — system-wide checks passed');
} catch (error) {
  console.error('\n[verify:system] FAILED — fix violations across the repo, not a single file');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
