import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('composeSpineGuard (DMCP Phase 4)', () => {
  it('COMPOSE-SPINE-01: wire emit prefixes are host · availability · add only', () => {
    const wire = read('packages/shared-types/src/compose-route.ts');
    expect(wire).toMatch(/formatComposeWire/);
    expect(wire).toMatch(/availability:open/);
    expect(wire).toMatch(/host:\$\{route\.kind\}/);
    expect(wire).toMatch(/add:\$\{route\.target\}/);
    expect(wire).not.toMatch(/return `seek:/);
    expect(wire).toMatch(/migrateSeekWireToAvailability/);
  });

  it('COMPOSE-SPINE-02: plan launcher delegates to CreateFlow (no parallel compose stack)', () => {
    const planFlow = read('src/plan/usePlanAddFlow.ts');
    expect(planFlow).toMatch(/useCreateFlow/);
    expect(planFlow).toMatch(/compose\.handleCreateTap/);
    expect(planFlow).toMatch(/availabilityOpenCompose/);
    expect(planFlow).not.toMatch(/CreateHostingActivityFlow/);
    const planPage = read('src/plan/PlanPage.tsx');
    expect(planPage).toMatch(/usePlanAddFlow/);
    expect(planPage).not.toMatch(/explorePath\(\{ compose/);
  });

  it('COMPOSE-SPINE-03: FAB copy is canonical via exploreCreateFabCopy', () => {
    expect(read('src/explore/compose.ts')).toMatch(/exploreCreateFabCopy/);
    expect(read('src/list/browseListCopy.ts')).toMatch(/exploreCreateFabCopy/);
    const listFab = read('src/list/ui/BrowseListCreateFab.tsx');
    expect(listFab).toMatch(/browseListCopy/);
    expect(listFab).not.toMatch(/EXPLORE_CREATE_FAB_HOST_TRIP/);
  });

  it('COMPOSE-SPINE-04: compose catalog maps three wizards only', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'hostingFlow'/);
    expect(catalog).toMatch(/wizard: 'availabilityFlow'/);
    expect(catalog).not.toMatch(/wizard: 'seekingFlow'/);
    expect(catalog).not.toMatch(/wizard: 'demandFlow'/);
    expect(catalog).toMatch(/COMPOSE_FLOW_SPEC_DOC/);
  });

  it('COMPOSE-SPINE-05: verify:compose-spine wired', () => {
    expect(read('package.json')).toMatch(/verify:compose-spine/);
    expect(existsSync(join(process.cwd(), 'scripts/verify-compose-spine.mjs'))).toBe(true);
  });
});