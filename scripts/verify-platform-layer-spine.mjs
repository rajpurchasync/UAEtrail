#!/usr/bin/env node
/**
 * MIG-PLATFORM-LAYER-SPINE — Publish · Discover · Join · Connect · Plan · Manage.
 * Schedule: scripts/platform-layer-spine-touchpoints.json
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const touchpointsPath = join(root, 'scripts/platform-layer-spine-touchpoints.json');
if (!existsSync(touchpointsPath)) {
  console.error('[verify:platform-layer-spine] missing scripts/platform-layer-spine-touchpoints.json');
  process.exit(1);
}

const spine = JSON.parse(readFileSync(touchpointsPath, 'utf8'));
const registry = JSON.parse(readFileSync(join(root, 'scripts/platform-touchpoint-registry.json'), 'utf8'));
const row = registry.programs?.find((p) => p.programId === spine.programId);
if (!row) {
  console.error('[verify:platform-layer-spine] registry missing', spine.programId);
  process.exit(1);
}

console.log('[verify:platform-layer-spine] program', spine.programId, 'status:', row.status ?? '?');
const inProgress = (spine.phases ?? []).filter((p) => p.status === 'in_progress');
console.log('[verify:platform-layer-spine] active phases:', inProgress.map((p) => p.id).join(', ') || 'none');

const run = (label, command) => {
  console.log(`\n[verify:platform-layer-spine] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

try {
  run(
    'Platform layers contract',
    'npx vitest run packages/shared-types/src/platform-layers.test.ts packages/shared-types/src/platform-layer-api.test.ts packages/shared-types/src/platform-surface-action.test.ts packages/shared-types/src/crew-discover-feed.test.ts src/config/platformLayerSpineGuard.test.ts src/config/platformLayerApiGuard.test.ts src/config/platformLayerCrewDiscoverGuard.test.ts src/config/platformLayerActionGuard.test.ts src/config/platformLayerMatchingGuard.test.ts src/config/platformLayerPls5Guard.test.ts src/config/exploreMapRecommendedGuard.test.ts'
  );
  console.log('\n[verify:platform-layer-spine] OK');
} catch {
  console.error('\n[verify:platform-layer-spine] FAILED');
  process.exit(1);
}