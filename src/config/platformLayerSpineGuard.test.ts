import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

type SpineManifest = {
  programId: string;
  layers: Record<string, string>;
  modules: Record<string, string[]>;
  surfaces: Array<{ id: string; layers: string[]; route?: string }>;
  phases: Array<{ id: string; status: string; deliverables: string[] }>;
  decisions?: { followPersonLayer?: string; wishlistLayer?: string };
};

describe('platformLayerSpineGuard (MIG-PLATFORM-LAYER-SPINE)', () => {
  const spine: SpineManifest = JSON.parse(read('scripts/platform-layer-spine-touchpoints.json'));

  it('LAYER-00: touchpoints manifest registered in platform-touchpoint-registry', () => {
    const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json')) as {
      programs: { programId: string; status: string; scheduleDoc?: string }[];
    };
    const row = registry.programs?.find((m) => m.programId === 'MIG-PLATFORM-LAYER-SPINE');
    expect(row).toBeTruthy();
    expect(row?.scheduleDoc).toBe('scripts/platform-layer-spine-touchpoints.json');
    expect(spine.programId).toBe('MIG-PLATFORM-LAYER-SPINE');
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
    expect(spine.modules.crew).not.toContain('join');
    expect(spine.modules.activity).toContain('join');
  });

  it('LAYER-03: plan and connect surfaces are disjoint in touchpoints', () => {
    const plan = spine.surfaces?.find((s) => s.id === 'surface.plan_hub');
    const connect = spine.surfaces?.find((s) => s.id === 'surface.connect_my_crews');
    expect(plan?.layers).toEqual(['plan']);
    expect(connect?.layers).toEqual(['connect']);
    expect(plan?.route).toBe('/plan');
    expect(connect?.route).toBe('/crews');
  });

  it('LAYER-04: wishlist on plan layer; follow on connect (decisions)', () => {
    expect(spine.decisions?.wishlistLayer).toBe('plan');
    expect(spine.decisions?.followPersonLayer).toBe('connect');
  });

  it('LAYER-05: PLS-0–5 complete in touchpoints', () => {
    const p0 = spine.phases.find((p) => p.id === 'PLS-0');
    const p5 = spine.phases.find((p) => p.id === 'PLS-5');
    expect(p0?.status).toBe('complete');
    expect(p5?.status).toBe('complete');
    expect(p5?.deliverables.some((d) => d.includes('ExploreMapRecommendedSheet'))).toBe(true);
  });

  it('LAYER-09: everyone facet maps to directory pillar (not guides_operators)', () => {
    const pillars = read('packages/shared-types/src/crew-pillars.ts');
    expect(pillars).toMatch(/crewPeopleFacetToPillar/);
    expect(pillars).toMatch(/'directory'/);
    expect(pillars).toMatch(/case 'everyone':[\s\S]*return 'directory'/);
    expect(pillars).not.toMatch(/case 'everyone':[\s\S]*guides_operators/);
  });

  it('LAYER-06: SYSTEM_COHERENCE references platform layer spine schedule', () => {
    const coherence = read('docs/SYSTEM_COHERENCE.md');
    expect(coherence).toMatch(/MIG-PLATFORM-LAYER-SPINE/);
    expect(coherence).toMatch(/platform-layer-spine-touchpoints\.json/);
  });

  it('LAYER-07: verify script wired in package.json', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['verify:platform-layer-spine']).toMatch(/verify-platform-layer-spine/);
  });
});