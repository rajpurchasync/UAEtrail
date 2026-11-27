import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { usesDirectApiFacade } from './apiGuardPatterns';

const EXPLORE_API_GUARD_ROOTS = [
  join(process.cwd(), 'src', 'explore'),
  join(process.cwd(), 'src', 'crew-discovery'),
];

/** R8.1 — explore UI must not call `api.*` / `apiRequest` directly; use hooks *ClientApi. */
const API_DOT_BASELINE = new Set<string>([
  'src/explore/exploreMapBasemap.ts',
  'src/explore/exploreMapBasemap.test.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

const RETIRED_EXPLORE_HOOKS = [
  'src/explore/useMemberPeople.ts',
  'src/explore/useMemberPersonBuddyRequest.ts',
  'src/explore/useSentActivityJoinInvites.ts',
];

describe('exploreApiGuard (R8.1)', () => {
  it('retired duplicate explore hooks stay removed (use roster / clientApi / invite modal)', () => {
    for (const file of RETIRED_EXPLORE_HOOKS) {
      expect(existsSync(join(process.cwd(), file)), file).toBe(false);
    }
  });

  it('organize publish refreshes client caches via hooks layer (R8.3)', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/explore/ui/CreateHostingActivityFlow.tsx'),
      'utf8'
    );
    const publishSource = readFileSync(
      join(process.cwd(), 'src/explore/ui/hostingActivityFlowPublish.ts'),
      'utf8'
    );
    expect(source).toMatch(/runHostingActivityFlowPublish/);
    expect(publishSource).toMatch(/afterHostingActivityPublishClientRefresh/);
    expect(source).not.toMatch(/\bapi\./);
    expect(publishSource).not.toMatch(/\bapi\./);
  });

  it('explore does not add new direct api facade usage', () => {
    const files = EXPLORE_API_GUARD_ROOTS.flatMap((root) => collectSourceFiles(root));
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      if (usesDirectApiFacade(source) && !API_DOT_BASELINE.has(file)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `New api.* in src/explore — move fetch to hooks/*ClientApi:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
