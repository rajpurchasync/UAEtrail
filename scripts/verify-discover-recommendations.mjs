#!/usr/bin/env node
/** MIG-DISCOVER-RECOMMENDATIONS — server-ranked Discover surfaces. */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const touchpointsPath = join(root, 'scripts/discover-recommendations-touchpoints.json');
if (!existsSync(touchpointsPath)) {
  console.error('[verify:discover-recommendations] missing touchpoints json');
  process.exit(1);
}

const touchpoints = JSON.parse(readFileSync(touchpointsPath, 'utf8'));
const registry = JSON.parse(readFileSync(join(root, 'scripts/platform-touchpoint-registry.json'), 'utf8'));
const row = registry.programs?.find((p) => p.programId === touchpoints.programId);
if (!row) {
  console.error('[verify:discover-recommendations] touchpoint registry missing', touchpoints.programId);
  process.exit(1);
}

console.log('[verify:discover-recommendations]', touchpoints.programId, 'status:', row.status ?? '?');

try {
  execSync(
    'npx vitest run packages/shared-types/src/discover-recommendations.test.ts packages/shared-types/src/map-explore-recommendation-score.test.ts packages/shared-types/src/recommended-crew-feed.test.ts src/config/migDiscoverRecommendationsGuard.test.ts src/explore/recommend/resolveExploreMapRecommendationItems.test.ts && npm --workspace @uaetrail/api test -- --run tests/discover-recommendations-contract.test.ts tests/discover-recommendations-http.test.ts',
    { cwd: root, stdio: 'inherit', env: childEnv() }
  );
  console.log('\n[verify:discover-recommendations] OK');
} catch {
  console.error('\n[verify:discover-recommendations] FAILED');
  process.exit(1);
}