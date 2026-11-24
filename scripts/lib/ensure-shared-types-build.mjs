/**
 * API vitest resolves `@uaetrail/shared-types` via the package `node` export → `dist/`.
 * Call before any `npm --workspace @uaetrail/api run test` when `build:api` did not run.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const distIndex = (root) => join(root, 'packages/shared-types/dist/index.js');

export const buildSharedTypesWorkspace = (root, env, options = {}) => {
  const { force = false, logPrefix } = options;
  if (!force && existsSync(distIndex(root))) return;
  if (logPrefix) {
    console.log(`\n[${logPrefix}] @uaetrail/shared-types build (API vitest)`);
  }
  execSync('npm run build --workspace @uaetrail/shared-types', {
    cwd: root,
    stdio: 'inherit',
    env,
  });
};