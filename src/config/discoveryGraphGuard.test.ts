import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('discoveryGraphGuard (DMCP Phase 3)', () => {
  it('DISC-03-01: GW-7 retired list facade — import discoveryRuntime directly', () => {
    expect(existsSync(join(process.cwd(), 'src/list/browse/discoveryListRuntime.ts'))).toBe(false);
    expect(read('src/explore/discoveryRuntime.ts')).toMatch(/fetchExploreMapItems/);
  });

  it('DISC-03-02: discoveryRuntime stays projection barrel (no list imports)', () => {
    const runtime = read('src/explore/discoveryRuntime.ts');
    expect(runtime).not.toMatch(/from ['"]\.\.\/list\//);
    expect(runtime).not.toMatch(/from ['"]\.\/routing\.ts/);
    expect(runtime).toMatch(/fetchExploreMapItems/);
  });

  it('DISC-03-03: list does not import explore/routing.ts', () => {
    const violations: string[] = [];
    const listRoot = join(process.cwd(), 'src/list');
    const walk = (dir: string) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          const content = read(rel);
          if (/from ['"]\.\.\/explore\/routing/.test(content)) violations.push(rel);
          if (/from ['"]\.\.\/\.\.\/explore\/routing/.test(content)) violations.push(rel);
        }
      }
    };
    walk(listRoot);
    expect(violations).toEqual([]);
  });

  it('DISC-03-04: import audit budget enforced', () => {
    const audit = JSON.parse(read('scripts/governance/discovery-import-audit.json'));
    const max = audit.limits?.maxListExploreImports ?? 25;
    const count = audit.listExploreImports ?? audit.matrix?.['src/list']?.explore ?? 999;
    expect(count).toBeLessThanOrEqual(max);
  });

  it('DISC-03-06: GW-7 browse leaves use discoverySessionExploreRuntime facade', () => {
    expect(read('src/list/browse/browseListFilters.ts')).toMatch(/discovery\/discoverySessionExploreRuntime/);
    expect(read('src/discovery/discoverySessionExploreRuntime.ts')).toMatch(/discoveryRuntime/);
  });

  it('W16–W17 cross-context surfaces route list browse via discoverySessionList facades', () => {
    const allowDirect = /list\//;
    const roots = [
      'src/activity',
      'src/place',
      'src/components/chat',
      'src/components/auth',
      'src/components/activity',
      'src/content',
      'src/my-crew',
      'src/geo',
      'src/crew-discovery',
    ];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (allowDirect.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('DISC-03-05: verify:discovery-graph wired', () => {
    expect(read('package.json')).toMatch(/verify:discovery-graph/);
    expect(existsSync(join(process.cwd(), 'scripts/verify/verify-discovery-graph.mjs'))).toBe(true);
  });
});