import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const walkTs = (dirRel: string, acc: string[] = []): string[] => {
  const dir = join(ROOT, dirRel);
  for (const name of readdirSync(dir)) {
    const rel = `${dirRel}/${name}`.replace(/\\/g, '/');
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      walkTs(rel, acc);
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      acc.push(rel);
    }
  }
  return acc;
};

const HOST_JOIN_SURFACES = [
  'src/operator/desk/JoinRequests.tsx',
  'src/operator/desk/Activities.tsx',
  'src/components/activity/ActivityManageSheet.tsx',
  'src/components/activity/detail/ActivityDetailHostCrewHub.tsx',
  'src/operator/desk/useHubData.ts',
  'src/hooks/useActivityHostJoinRequests.ts',
] as const;

const CONSUMER_JOIN_MUTATION_ALLOW = new Set([
  'src/hooks/activityJoinClientApi.ts',
  'src/api/domains/activities.ts',
  'src/api/services.ts',
  'src/api/index.ts',
]);

const HOST_QUEUE_MUTATION_ALLOW = new Set([
  'src/hooks/publishingJoinQueueClientApi.ts',
  'src/api/domains/publishingWorkspace.ts',
  'src/api/services.ts',
  'src/api/index.ts',
]);

describe('participationJoinSpineGuard', () => {
  it('PART-SPINE-01: host join queue surfaces use publishingJoinQueueClientApi', () => {
    const violations: string[] = [];
    for (const file of HOST_JOIN_SURFACES) {
      const source = read(file);
      const tenantQueueImport = source.match(
        /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*tenantActivityClientApi['"]/
      );
      if (
        tenantQueueImport &&
        /getActivityJoinRequests|decideActivityJoinRequest/.test(tenantQueueImport[1])
      ) {
        violations.push(`${file}: import join queue from publishingJoinQueueClientApi, not tenantActivityClientApi`);
      }
      if (/getActivityJoinRequests|decideActivityJoinRequest/.test(source)) {
        if (!source.includes('publishingJoinQueueClientApi')) {
          violations.push(`${file}: missing publishingJoinQueueClientApi import`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('PART-SPINE-02: member join mutations only via activityJoinClientApi in hooks', () => {
    const violations: string[] = [];
    for (const file of walkTs('src/hooks')) {
      if (CONSUMER_JOIN_MUTATION_ALLOW.has(file)) continue;
      const source = read(file);
      if (/\bapi\.(createJoinRequest|rsvpActivity)\b/.test(source)) {
        violations.push(`${file}: route join mutations through activityJoinClientApi`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('PART-SPINE-03: host queue mutations only via publishingJoinQueueClientApi outside API layer', () => {
    const violations: string[] = [];
    for (const rel of [
      ...walkTs('src/pages'),
      ...walkTs('src/components'),
      ...walkTs('src/operator/desk'),
      ...walkTs('src/hooks'),
    ]) {
      if (HOST_QUEUE_MUTATION_ALLOW.has(rel)) continue;
      const source = read(rel);
      if (/\bapi\.(decideActivityJoinRequest|getPublishingActivityJoinRequests)\b/.test(source)) {
        violations.push(`${rel}: route host queue through publishingJoinQueueClientApi`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('PART-SPINE-04: publishingJoinQueueClientApi is thin facade over workspace API', () => {
    const source = read('src/hooks/publishingJoinQueueClientApi.ts');
    expect(source).toMatch(/getPublishingActivityJoinRequests/);
    expect(source).toMatch(/decideActivityJoinRequest/);
    expect(source).not.toMatch(/fetch\(/);
  });
});
