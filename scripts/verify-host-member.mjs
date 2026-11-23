#!/usr/bin/env node
/**
 * Host/member model verification — run before merging tier or /host route work.
 * Wired as `npm run verify:host-member`.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = () => stripNpmDevdirEnv();

const run = (label, command) => {
  console.log(`\n[verify:host-member] ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: childEnv() });
};

try {
  run('API typecheck', 'npm run typecheck:api');
  run('API host-member contracts', 'npm --workspace @uaetrail/api run test -- --run tests/host-member-contract.test.ts tests/member-publishing-workspace-access.test.ts');
  run('API member-discovery contracts', 'npm --workspace @uaetrail/api run test -- --run tests/member-discovery-contract.test.ts');
  run(
    'Frontend host-member + schedule/guide guards',
    'npx vitest run src/member/hostMemberGuard.test.ts src/config/migScheduleGuideGuard.test.ts'
  );
  console.log('\n[verify:host-member] OK');
} catch (error) {
  console.error('\n[verify:host-member] FAILED');
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
