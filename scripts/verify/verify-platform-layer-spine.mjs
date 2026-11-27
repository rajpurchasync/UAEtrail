#!/usr/bin/env node
/**
 * MIG-PLATFORM-LAYER-SPINE — Publish · Discover · Join · Connect · Plan · Manage.
 * Enforcement: shared-types contracts + platformLayerSpineGuard (schedule JSON retired).
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const retired = [
  'scripts/governance/platform-layer-spine-touchpoints.json',
  'scripts/governance/platform-layer-spine-touchpoints.schema.json',
];
for (const rel of retired) {
  if (existsSync(join(root, rel))) {
    console.error(`[verify:platform-layer-spine] retired schedule must not exist: ${rel}`);
    process.exit(1);
  }
}

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