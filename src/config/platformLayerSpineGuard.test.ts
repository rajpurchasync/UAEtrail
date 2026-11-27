import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JOIN_LAYER_MODULES, MODULE_LAYER_MATRIX } from '@uaetrail/shared-types';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformLayerSpineGuard (MIG-PLATFORM-LAYER-SPINE)', () => {
  it('LAYER-00: platform layer spine schedule JSON retired', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-layer-spine-touchpoints.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-layer-spine-touchpoints.schema.json'))).toBe(false);
  });

  it('LAYER-01: platform-layers.ts defines six layers without engage', () => {
    const layers = read('packages/shared-types/src/platform-layers.ts');
    expect(layers).toMatch(/PLATFORM_LAYERS/);
    expect(layers).toMatch(/'publish'/);
    expect(layers).toMatch(/'discover'/);
    expect(layers).toMatch(/'join'/);
    expect(layers).toMatch(/'connect'/);
    expect(layers).toMatch(/'plan'/);
    expect(layers).toMatch(/'manage'/);
    expect(layers).not.toMatch(/'engage'/);
    expect(existsSync(join(ROOT, 'packages/shared-types/src/platform-layers.test.ts'))).toBe(true);
  });

  it('LAYER-02: crew module excludes join in shared-types matrix', () => {
    expect(MODULE_LAYER_MATRIX.crew).not.toContain('join');
    expect(JOIN_LAYER_MODULES).toEqual(['activity']);
  });

  it('LAYER-03: plan and connect surfaces are disjoint routes', () => {
    const surfacePaths = read('src/config/surfacePaths.ts');
    expect(surfacePaths).toMatch(/PLAN_PATH = '\/plan'/);
    expect(surfacePaths).toMatch(/MY_CREWS_PATH = '\/crews'/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/MY_CREWS_PATH/);
    expect(read('src/crew/crewPillarSurfaces.ts')).toMatch(/friends: MY_CREWS_PATH/);
    expect(existsSync(join(ROOT, 'src/plan/planTab.ts'))).toBe(true);
  });

  it('LAYER-04: wishlist on plan layer; follow on connect (surface actions)', () => {
    const actions = read('packages/shared-types/src/platform-surface-action.ts');
    expect(actions).toMatch(/PLAN_ACTION_IDS[\s\S]*'wishlist_save'/);
    expect(actions).toMatch(/CONNECT_ACTION_IDS[\s\S]*'entity_follow'/);
    expect(actions).toMatch(/plan:[\s\S]*wishlist_save[\s\S]*POST \/me\/wishlist/);
    expect(actions).toMatch(/connect:[\s\S]*entity_follow[\s\S]*POST \/me\/follows/);
  });

  it('LAYER-05: explore map recommendations sheet shipped (PLS-5)', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/ExploreMapRecommendedSheet.tsx'))).toBe(true);
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/ExploreMapRecommendedSheet|useDiscoverMapRecommendations/);
  });

  it('LAYER-09: everyone facet maps to directory pillar (not guides_operators)', () => {
    const pillars = read('packages/shared-types/src/crew-pillars.ts');
    expect(pillars).toMatch(/crewPeopleFacetToPillar/);
    expect(pillars).toMatch(/'directory'/);
    expect(pillars).toMatch(/case 'everyone':[\s\S]*return 'directory'/);
    expect(pillars).not.toMatch(/case 'everyone':[\s\S]*guides_operators/);
  });

  it('LAYER-07: verify script wired in package.json', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['verify:platform-layer-spine']).toMatch(/verify-platform-layer-spine/);
  });
});