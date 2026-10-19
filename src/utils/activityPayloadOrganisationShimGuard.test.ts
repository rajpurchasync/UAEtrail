import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ALLOWLIST = new Set([
  'src/components/activities/ActivityActionsMenu.tsx',
  'src/components/activities/index.ts',
  'src/utils/activityPublishPayload.ts',
  'src/utils/activityPublishPayload.test.ts',
]);

const DEPRECATED_BUILDERS = /\bbuildOrganisationActivity(?:Payload|MenuItems|PublishPayload)\b/;

const listTrackedSourceFiles = (): string[] =>
  execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

describe('activityPayloadOrganisationShimGuard', () => {
  it('app code uses Host* activity builders, not Organisation-named shims', () => {
    const violations: string[] = [];

    for (const file of listTrackedSourceFiles()) {
      if (ALLOWLIST.has(file) || file.startsWith('src/api/')) continue;
      if (!existsSync(file)) continue;
      const content = readFileSync(file, 'utf8');
      if (DEPRECATED_BUILDERS.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
