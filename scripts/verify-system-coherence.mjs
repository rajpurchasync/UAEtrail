#!/usr/bin/env node
/**
 * System-wide coherence — single entry for alignment work (not host-only or Tier-1-only).
 * @see docs/SYSTEM_COHERENCE.md §3 · docs/DOCS_GOVERNANCE.md
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const run = (label, command) => {
  console.log(`\n[verify:system] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit' });
};

const quick = process.argv.includes('--quick');

const steps = [
  ['Tier-1 docs', 'npm run verify:docs'],
  ['Domain + routing + naming guards', 'npm run verify:domain'],
  ['Host/member contracts', 'npm run verify:host-member'],
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
