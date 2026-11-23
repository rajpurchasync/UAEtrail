import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('composeSpineGuard (DMCP Phase 4 rollup)', () => {
  it('COMPOSE-SPINE-01: wire emit prefixes are activity · intent · place only', () => {
    const wire = read('packages/shared-types/src/compose-route.ts');
    expect(wire).toMatch(/formatComposeWire/);
    expect(wire).toMatch(/intent:open/);
    expect(wire).toMatch(/activity:\$\{route\.kind\}/);
    expect(wire).toMatch(/place:facility:/);
    expect(wire).not.toMatch(/return `seek:/);
    expect(wire).not.toMatch(/migrateLegacyComposeWire/);
    expect(wire).not.toMatch(/seek:flexible/);
  });

  it('COMPOSE-SPINE-02: plan launcher delegates to CreateFlow (no parallel compose stack)', () => {
    const planFlow = read('src/plan/usePlanAddFlow.ts');
    expect(planFlow).toMatch(/useCreateFlow/);
    expect(planFlow).toMatch(/compose\.handleCreateTap/);
    expect(planFlow).toMatch(/openComposeOuting/);
    expect(planFlow).toMatch(/composeKind: 'activity'/);
    expect(planFlow).not.toMatch(/availabilityOpenCompose/);
    expect(planFlow).not.toMatch(/CreateHostingActivityFlow/);
    const planPage = read('src/plan/PlanPage.tsx');
    expect(planPage).toMatch(/usePlanAddFlow/);
    expect(planPage).not.toMatch(/explorePath\(\{ compose/);
  });

  it('COMPOSE-SPINE-03: FAB copy is canonical via exploreCreateFabCopy', () => {
    expect(read('src/explore/compose.ts')).toMatch(/exploreCreateFabCopy/);
    expect(read('src/list/browse/browseListCopy.ts')).toMatch(/exploreCreateFabCopy/);
    const listFab = read('src/list/explorer/BrowseListCreateFab.tsx');
    expect(listFab).toMatch(/browse\/browseListCopy/);
    expect(listFab).not.toMatch(/EXPLORE_CREATE_FAB_HOST_TRIP/);
  });

  it('COMPOSE-SPINE-04: compose catalog maps three wizards only', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'hostingFlow'/);
    expect(catalog).toMatch(/wizard: 'intentFixedFlow'/);
    expect(catalog).not.toMatch(/wizard: 'seekingFlow'/);
    expect(catalog).not.toMatch(/wizard: 'demandFlow'/);
    expect(catalog).toMatch(/COMPOSE_FLOW_SPEC_DOC/);
  });

  it('COMPOSE-SPINE-05: verify:compose-spine wired', () => {
    expect(read('package.json')).toMatch(/verify:compose-spine/);
    expect(existsSync(join(process.cwd(), 'scripts/verify-compose-spine.mjs'))).toBe(true);
  });
});