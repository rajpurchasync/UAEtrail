import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = [
  'src/pages/operator',
  'src/console',
  'src/components/activity',
  'src/components/plan',
  'src/pages/activities',
];

const MANAGE_ACTION_SHIM_FILES = new Set([
  'src/hooks/useHostActivityManageActions.ts',
  'src/hooks/useOperatorActivityManageActions.ts',
]);

const collectTs = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTs(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('publishingConsoleHookGuard', () => {
  it('publishing UI uses tenantActivityClientApi (not legacy host/operator client shims)', () => {
    const violations: string[] = [];
    for (const root of ROOTS) {
      const abs = join(process.cwd(), root);
      for (const file of collectTs(abs)) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/from\s+['"].*hostActivityClientApi['"]/.test(content)) {
          violations.push(`${file}: import tenantActivityClientApi`);
        }
        if (/from\s+['"].*operatorActivityClientApi['"]/.test(content)) {
          violations.push(`${file}: import tenantActivityClientApi`);
        }
        if (/\bapi\.listHostActivities\s*\(/.test(content)) {
          violations.push(`${file}: use api.listActivities`);
        }
        if (/\bapi\.listOperatorActivities\s*\(/.test(content)) {
          violations.push(`${file}: use api.listActivities`);
        }
        if (/\bapi\.getHostActivityJoinRequests\s*\(/.test(content)) {
          violations.push(`${file}: use api.getOperatorActivityJoinRequests`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('publishing UI uses useOperatorActivityManageActions (not legacy useHostActivityManageActions)', () => {
    const violations: string[] = [];
    const scanRoots = [...ROOTS, 'src/hooks'];
    for (const root of scanRoots) {
      const abs = join(process.cwd(), root);
      for (const file of collectTs(abs)) {
        if (MANAGE_ACTION_SHIM_FILES.has(file)) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/from\s+['"].*useHostActivityManageActions['"]/.test(content)) {
          violations.push(`${file}: import useOperatorActivityManageActions`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('console surfaces use useMemberStatus (not legacy status shims)', () => {
    const violations: string[] = [];
    for (const root of ROOTS) {
      const abs = join(process.cwd(), root);
      for (const file of collectTs(abs)) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/from\s+['"].*useHostStatus['"]/.test(content)) {
          violations.push(`${file}: import useMemberStatus`);
        }
        if (/from\s+['"].*useOperatorStatus['"]/.test(content)) {
          violations.push(`${file}: import useMemberStatus`);
        }
        if (/from\s+['"].*usePublishingAccess['"]/.test(content)) {
          violations.push(`${file}: import useMemberStatus`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
