import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** PLS-5 + early Discover recommendations on explore map. */
describe('exploreMapRecommendedGuard', () => {
  it('LAYER-16: map shell ranks catalog and mounts bottom sheet on stage', () => {
    expect(existsSync(join(ROOT, 'src/explore/recommend/buildExploreMapRecommendations.ts'))).toBe(true);
    expect(read('src/explore/recommend/buildExploreMapRecommendations.ts')).toMatch(/scoreExploreMapCatalogItem/);
    expect(existsSync(join(ROOT, 'src/explore/ui/ExploreMapRecommendedSheet.tsx'))).toBe(true);
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/resolveExploreMapRecommendationItems/);
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/useDiscoverMapRecommendations/);
    expect(read('src/explore/ui/ExploreMapStage.tsx')).toMatch(/ExploreMapRecommendedSheet/);
    const touchpoints = JSON.parse(read('scripts/governance/platform-layer-spine-touchpoints.json')) as {
      decisions?: { matching?: { phases?: Record<string, string> } };
    };
    expect(touchpoints.decisions?.matching?.phases?.discoverV1).toMatch(/discover\/recommendations/i);
    expect(touchpoints.decisions?.matching?.phases?.discoverV1).toMatch(/surface=map/);
  });
});