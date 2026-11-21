#!/usr/bin/env node
/**
 * DMCP Phase 6 — operator / storefront spine (PublishingProfileKind, /publishing console, shop/agency public).
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
  console.log(`\n[verify:storefront-spine] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/authority-matrix.json'), 'utf8'));
const storefront = (matrix.actions ?? []).filter((a) => a.axis === 'C_STOREFRONT');
console.log('[verify:storefront-spine] scorecard');
console.log(`  C_STOREFRONT matrix rows: ${storefront.length}`);
console.log(`  dmcpPhase: ${matrix.dmcpPhase ?? 'unknown'}`);

try {
  run(
    'FE storefront + publishing console guards',
    'npx vitest run src/config/operatorStorefrontSpineGuard.test.ts src/config/publishingConsoleRoutingGuard.test.ts src/member/publishingConsoleHookGuard.test.ts src/member/hostMemberGuard.test.ts src/member/organisationNamingGuard.test.ts src/config/detailSurfaceDataLineageGuard.test.ts src/utils/proMembershipSurfaceGuard.test.ts'
  );
  run('Host-member API contracts', 'npm run verify:host-member');
  run(
    'Detail + shop lineage API',
    'npm --workspace @uaetrail/api run test -- --run tests/detail-surface-lineage-contract.test.ts'
  );
  console.log('\n[verify:storefront-spine] OK');
} catch (error) {
  console.error('\n[verify:storefront-spine] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}