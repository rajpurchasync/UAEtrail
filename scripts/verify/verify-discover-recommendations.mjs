#!/usr/bin/env node
/** Discover recommendations — contract tests only (no touchpoint schedule JSON). */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const retiredTouchpoints = join(root, 'scripts/governance/discover-recommendations-touchpoints.json');
if (existsSync(retiredTouchpoints)) {
  console.error('[verify:discover-recommendations] retired touchpoints json must not exist');
  process.exit(1);
}

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