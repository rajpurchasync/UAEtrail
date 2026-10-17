#!/usr/bin/env node
/**
 * Routing alignment program — Phase 0: map + program spine.
 * Strict path enforcement toggles per phase in routing-canonical-map.json → enforcement.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'scripts/routing-canonical-map.json');
let failed = false;

const fail = (msg) => {
  console.error(`[verify:routing-canon] ${msg}`);
  failed = true;
};

if (!existsSync(mapPath)) {
  fail('missing scripts/routing-canonical-map.json');
  process.exit(1);
}

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const program = JSON.parse(
  readFileSync(join(root, 'scripts/refactor-program.json'), 'utf8')
);

const routingMigs = (program.migrations ?? []).filter((m) => m.id?.startsWith('MIG-ROUTING-CANON'));
if (routingMigs.length === 0) {
  fail('refactor-program.json must list MIG-ROUTING-CANON-* migrations (§8.7)');
}

const coherence = readFileSync(join(root, 'docs/SYSTEM_COHERENCE.md'), 'utf8');
if (!coherence.includes('#### 8.7 Routing alignment')) {
  fail('SYSTEM_COHERENCE.md missing §8.7 Routing alignment');
}

const enforcement = map.enforcement ?? 'phase0';
if (!map.planes?.publishing_workspace?.api?.includes('/publishing')) {
  fail('routing-canonical-map: publishing_workspace API must be /publishing');
}
const atLeastPhase1 =
  enforcement === 'phase1' ||
  enforcement === 'phase2' ||
  enforcement === 'phase3' ||
  enforcement === 'phase4' ||
  enforcement === 'strict';

if (atLeastPhase1) {
  const forbidden = map.forbidden ?? {};
  const routesIndex = readFileSync(join(root, 'apps/api/src/routes/index.ts'), 'utf8');
  for (const mod of forbidden.middlewareModules ?? []) {
    if (routesIndex.includes(mod.replace('.ts', ''))) {
      fail(`routes/index.ts must not use legacy middleware ${mod}`);
    }
  }
  const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
  if (appTsx.includes('LegacyPublishingConsoleRedirect')) {
    fail('App.tsx must not use LegacyPublishingConsoleRedirect');
  }
}

if (enforcement === 'phase3' || enforcement === 'phase4' || enforcement === 'strict') {
  const routesIndex = readFileSync(join(root, 'apps/api/src/routes/index.ts'), 'utf8');
  if (routesIndex.includes("use('/social'")) {
    fail('routes/index.ts must not mount /social graph router (P3)');
  }
  const discoveryRegistrar = readFileSync(
    join(root, 'apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts'),
    'utf8'
  );
  if (discoveryRegistrar.includes('/users/browse') || discoveryRegistrar.includes('/social/people')) {
    fail('registerMemberDiscoveryRoutes must use /me/member-discovery/* only (P3)');
  }
}

if (enforcement === 'phase2' || enforcement === 'phase3' || enforcement === 'phase4' || enforcement === 'strict') {
  const memberRegistrar = readFileSync(
    join(root, 'apps/api/src/routes/user/registerPublicMemberRoutes.ts'),
    'utf8'
  );
  if (memberRegistrar.includes('/users/:userId/public-profile')) {
    fail('registerPublicMemberRoutes must use /member/:userId/profile (P2)');
  }
  const accountApi = readFileSync(join(root, 'src/api/domains/account.ts'), 'utf8');
  if (accountApi.includes('/users/${userId}/public-profile')) {
    fail('accountApi must not call /users/:id/public-profile (P2)');
  }
}

if (enforcement === 'phase4' || enforcement === 'strict') {
  const routesIndex = readFileSync(join(root, 'apps/api/src/routes/index.ts'), 'utf8');
  if (routesIndex.includes("use('/reports', reportsRouter")) {
    fail('routes/index.ts must mount safetyRouter at /safety, not /reports (P4)');
  }
  const socialApi = readFileSync(join(root, 'src/api/domains/social.ts'), 'utf8');
  if (socialApi.includes('reportContent')) {
    fail('socialApi must not define reportContent — use safetyApi (P4)');
  }
  const safetyApi = readFileSync(join(root, 'src/api/domains/safety.ts'), 'utf8');
  if (!safetyApi.includes('/safety/reports')) {
    fail('safetyApi must POST /safety/reports (P4)');
  }
}

if (failed) {
  console.error('\n[verify:routing-canon] FAILED');
  process.exit(1);
}

console.log(`[verify:routing-canon] OK — enforcement=${enforcement}, ${routingMigs.length} routing migration(s)`);
