#!/usr/bin/env node
/**
 * Domain / routing canonical docs and entry module present.
 * @see docs/DOMAIN_CANONICALS.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

execSync('node scripts/verify-routing-canon.mjs', { cwd: root, stdio: 'inherit', env: childEnv() });

const required = [
  'docs/DOMAIN_CANONICALS.md',
  'src/config/routingCatalog.ts',
  'packages/shared-types/src/entity-path.ts',
];

let failed = false;

for (const rel of required) {
  if (!existsSync(join(root, rel))) {
    console.error(`[verify:domain] missing ${rel}`);
    failed = true;
  }
}

const canon = readFileSync(join(root, 'docs/DOMAIN_CANONICALS.md'), 'utf8');
for (const needle of ['EntityRef', 'routingCatalog', 'participant-intents', 'TRIPS_PATH', '3.2.1 Discovery projection']) {
  if (!canon.includes(needle)) {
    console.error(`[verify:domain] DOMAIN_CANONICALS.md missing "${needle}"`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[verify:domain] FAILED');
  process.exit(1);
}

console.log('[verify:domain] docs + catalog OK');

execSync('npm run verify:domain:fe', { cwd: root, stdio: 'inherit', env: childEnv() });
execSync('npm run verify:domain:api', { cwd: root, stdio: 'inherit', env: childEnv() });

console.log('[verify:domain] guards OK');

