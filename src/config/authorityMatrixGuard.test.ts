import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const matrixPath = join(ROOT, 'scripts/authority-matrix.json');
const manifestPath = join(ROOT, 'scripts/bounded-context-manifest.json');

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectTs = (dirRel: string, opts?: { skipTests?: boolean }): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry === 'node_modules') continue;
        walk(full);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        if (opts?.skipTests && (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx'))) continue;
        out.push(relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(join(ROOT, dirRel));
  return out;
};

describe('authorityMatrixGuard (DMCP Phase 0)', () => {
  const matrix = JSON.parse(read('scripts/authority-matrix.json'));
  const manifest = JSON.parse(read('scripts/bounded-context-manifest.json'));
  const contextIds = new Set((manifest.contexts ?? []).map((c: { id: string }) => c.id));

  it('AUTH-00: matrix meets minimum action count', () => {
    const min = matrix.minActions ?? 40;
    expect((matrix.actions ?? []).length).toBeGreaterThanOrEqual(min);
  });

  it('AUTH-01: every action maps to a manifest context + known axis', () => {
    const axes = new Set(Object.keys(matrix.axes ?? {}));
    for (const action of matrix.actions ?? []) {
      expect(contextIds.has(action.contextId), `${action.id} context`).toBe(true);
      expect(axes.has(action.axis), `${action.id} axis`).toBe(true);
    }
  });

  it('AUTH-02: sole publish resolver is resolveMemberStatus (API)', () => {
    const status = read('apps/api/src/services/member-status.ts');
    expect(status).toMatch(/export const resolveMemberStatus/);
    const publishActions = (matrix.actions ?? []).filter((a: { axis: string }) => a.axis === 'B_PUBLISH');
    for (const action of publishActions) {
      if (action.resolver?.symbol === 'resolveMemberStatus') {
        expect(action.resolver.module).toBe('apps/api/src/services/member-status.ts');
      }
    }
  });

  it('AUTH-03: seek compose emit only in shared-types compose-route', () => {
    const violations: string[] = [];
    for (const file of collectTs('src/explore/ui', { skipTests: true })) {
      if (file.includes('availabilityFlowEngine')) continue;
      const source = read(file);
      if (/`seek:fixed:/.test(source) || /`seek:flexible`/.test(source)) {
        violations.push(`${file}: outbound seek: compose literal`);
      }
    }
    expect(violations).toEqual([]);
    expect(read('packages/shared-types/src/compose-route.ts')).toMatch(/seek:flexible/);
    expect(read('src/config/composeLineageGuard.test.ts')).toMatch(/COMPOSE-LINE-03/);
  });

  it('AUTH-04: explore hub module stays retired', () => {
    expect(existsSync(join(ROOT, 'src/explore/hub'))).toBe(false);
  });

  it('AUTH-07: FE publish gates read publish slice only (DMCP Phase 1)', () => {
    const hook = read('src/hooks/useMemberStatus.ts');
    expect(hook).toMatch(/publish\?\.canAccessPublishingWorkspace/);
    expect(hook).toMatch(/publish\?\.isPlatformStaff/);
    expect(hook).not.toMatch(/\bisHostRole\b/);
    const workspaceResolver = read('apps/api/src/services/member-publishing-workspace-access.ts');
    expect(workspaceResolver).not.toMatch(/\bisHostRole\b/);
  });

  it('AUTH-12: release ops spine wired (DMCP Phase 8)', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(8);
    expect(matrix.actions?.find((a: { id: string }) => a.id === 'ops.release_checklist')).toBeTruthy();
    expect(read('package.json')).toMatch(/verify:release-ops/);
    expect(read('src/config/releaseOpsSpineGuard.test.ts')).toMatch(/RELEASE-SPINE-05/);
  });

  it('AUTH-13: DMCP eng program closed in matrix + program JSON', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    expect(matrix.dmcpStatus).toBe('complete');
    const choke = (matrix.readCompatChokePoints ?? []).find(
      (c: { id: string }) => c.id === 'people-crews-tab-inbound'
    );
    expect(choke?.module).toBe('src/routing/productUrlInbound.ts');
    const program = JSON.parse(read('scripts/refactor-program.json'));
    expect(program.authorization?.statement).toMatch(/DMCP eng verify complete/);
  });

  it('AUTH-11: people graph uses Team wire, Communities stay planned (DMCP Phase 7)', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(7);
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('social.group_create')?.note).toMatch(/Team/);
    expect(byId.get('social.buddy_request')?.note).toMatch(/Friends/);
    expect(byId.get('people.plan_hub')?.note).toMatch(/No Plan aggregate/);
    const program = JSON.parse(read('scripts/refactor-program.json'));
    expect(program.migrations?.find((m: { id: string }) => m.id === 'MIG-COMMUNITY-DISCOVER')?.status).toBe(
      'planned'
    );
    expect(read('src/config/peopleGraphPlanSpineGuard.test.ts')).toMatch(/PEOPLE-SPINE-06/);
    expect(read('package.json')).toMatch(/verify:people-graph-plan/);
  });

  it('AUTH-10: storefront kinds and Pro path stay matrix-resolved (DMCP Phase 6)', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(6);
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('client.pro_membership')?.resolver?.module).toBe('src/config/memberRoutes.ts');
    expect(byId.get('shop.public_profile')?.resolver?.symbol).toBe('inferHostStorefrontKindFromTenantWire');
    expect(byId.get('storefront.agency_public')?.axis).toBe('C_STOREFRONT');
    expect(read('src/config/operatorStorefrontSpineGuard.test.ts')).toMatch(/STOREFRONT-SPINE-06/);
    expect(read('package.json')).toMatch(/verify:storefront-spine/);
  });

  it('AUTH-09: participation join clients are sole FE mutators (DMCP Phase 5)', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(5);
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('client.join_api')?.resolver?.module).toBe('src/hooks/activityJoinClientApi.ts');
    expect(byId.get('client.publishing_join_queue')?.resolver?.module).toBe(
      'src/hooks/publishingJoinQueueClientApi.ts'
    );
    expect(byId.get('participate.join_request')?.resolver?.module).toMatch(/activity-engagement-policy/);
    expect(read('src/config/participationSpineGuard.test.ts')).toMatch(/PART-SPINE-ROLLUP-06/);
    expect(read('package.json')).toMatch(/verify:participation-spine/);
  });

  it('AUTH-08: find crew catalog rows name availability (DMCP Phase 2)', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('availability.map_pin')?.contextId).toBe('availability');
    expect(byId.get('discover.catalog_assembler')?.resolver?.module).toMatch(
      /discovery-catalog-builder/
    );
    const legacy = byId.get('legacy.seeking_map_product') as { retired?: boolean } | undefined;
    expect(legacy?.retired).toBe(true);
  });

  it('AUTH-05: matrix file is wired to verifier script', () => {
    expect(existsSync(matrixPath)).toBe(true);
    expect(read('package.json')).toMatch(/verify:authority-matrix/);
    expect(read('scripts/verify-authority-matrix.mjs')).toMatch(/authority-matrix\.json/);
  });
});