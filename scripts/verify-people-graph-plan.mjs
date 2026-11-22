#!/usr/bin/env node
/**
 * DMCP Phase 7 — Teams · outing crew · Friends · /plan hub (not discoverable Communities).
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
  console.log(`\n[verify:people-graph-plan] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

const matrix = JSON.parse(readFileSync(join(root, 'scripts/authority-matrix.json'), 'utf8'));
const peopleGraph = (matrix.actions ?? []).filter(
  (a) => a.contextId === 'social_graph' || a.contextId === 'member_discovery'
);
console.log('[verify:people-graph-plan] scorecard');
console.log(`  people-graph matrix rows: ${peopleGraph.length}`);
console.log(`  dmcpPhase: ${matrix.dmcpPhase ?? 'unknown'}`);

try {
  run(
    'FE teams · plan · crews guards',
    'npx vitest run src/config/peopleGraphPlanSpineGuard.test.ts src/config/crewsTerminologyGuard.test.ts src/config/crewDiscoveryNamingGuard.test.ts src/config/peopleVocabularyTouchpointsGuard.test.ts src/config/crewPillarsAlignmentGuard.test.ts src/config/communityDiscoverGuard.test.ts src/member-plan/planHubInboundGuard.test.ts src/config/planSurfaceApiGuard.test.ts packages/shared-types/src/member-group.test.ts packages/shared-types/src/crew-pillars.test.ts packages/shared-types/src/community-discover.test.ts src/crew-discovery/buildRecommendedCrewFeed.test.ts src/crew-discovery/crewBrowseFeatureGates.test.ts'
  );
  run(
    'Cross-context people browse',
    'npx vitest run src/config/crossContextFoundationsGuard.test.ts -t "CTX-FOUND-09|CTX-FOUND-08"'
  );
  run(
    'API member group model',
    'npm --workspace @uaetrail/api run test -- --run tests/member-group-model-guard.test.ts tests/community-discover-contract.test.ts'
  );
  console.log('\n[verify:people-graph-plan] OK');
} catch (error) {
  console.error('\n[verify:people-graph-plan] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}