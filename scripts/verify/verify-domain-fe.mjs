#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from '../lib/strip-npm-devdir-env.mjs';
import { DOMAIN_FE_VITEST_FILES } from './domain-fe-vitest-files.mjs';

stripNpmDevdirFromProcess();
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const childEnv = () => stripNpmDevdirEnv();

const BATCH_SIZE = 45;

console.log('[verify:domain:fe]');
for (let i = 0; i < DOMAIN_FE_VITEST_FILES.length; i += BATCH_SIZE) {
  const batch = DOMAIN_FE_VITEST_FILES.slice(i, i + BATCH_SIZE);
  const label = `${i + 1}-${Math.min(i + BATCH_SIZE, DOMAIN_FE_VITEST_FILES.length)} / ${DOMAIN_FE_VITEST_FILES.length}`;
  console.log(`[verify:domain:fe] vitest batch ${label}`);
  execSync(`npx vitest run --testTimeout 30000 ${batch.join(' ')}`, {
    cwd: root,
    stdio: 'inherit',
    env: childEnv(),
  });
}
console.log('[verify:domain:fe] OK');