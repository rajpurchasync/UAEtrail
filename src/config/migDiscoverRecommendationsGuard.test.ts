import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('migDiscoverRecommendationsGuard (MIG-DISCOVER-RECOMMENDATIONS)', () => {
  it('REC-01: discover recommendations route + matching ranker', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/services/discover-map-recommendations.ts'))).toBe(true);
    expect(read('apps/api/src/routes/user/registerDiscoverRecommendationsRoutes.ts')).toMatch(
      /\/discover\/recommendations/
    );
    expect(read('apps/api/src/routes/user/composeUserPublicRoutes.ts')).toMatch(
      /registerDiscoverRecommendationsRoutes/
    );
    expect(read('apps/api/src/services/matching/rank-map-explore.ts')).toMatch(/scoreMapExploreActivityCore/);
    expect(read('packages/shared-types/src/map-explore-recommendation-score.ts')).toMatch(
      /MAP_EXPLORE_RECOMMEND_WEIGHTS/
    );
    expect(read('packages/shared-types/src/map-explore-recommendation-score.ts')).toMatch(/wishlist_place/);
    expect(read('apps/api/src/services/discover-map-recommendations.ts')).toMatch(/rankMapExplorePlace/);
  });

  it('REC-02: map shell uses server rows when signed in', () => {
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/useDiscoverMapRecommendations/);
    expect(read('src/explore/ui/ExploreMapRecommendedSheet.tsx')).toMatch(/RecommendationSignalChips/);
    expect(read('scripts/discover-recommendations-touchpoints.json')).toMatch(/REC-8/);
    expect(read('packages/shared-types/src/map-explore-recommendation-score.ts')).toMatch(/near_you/);
    expect(read('src/crew-discovery/panel/crewBrowse/CrewBrowseRecommendedBody.tsx')).toMatch(
      /resolveRecommendedCrewFeedRows/
    );
    expect(read('src/crew-discovery/panel/crewBrowse/CrewBrowseMemberRow.tsx')).toMatch(
      /CrewRecommendationBucketChip/
    );
    expect(existsSync(join(ROOT, 'apps/api/tests/discover-recommendations-http.test.ts'))).toBe(true);
    expect(read('docs/API_ROUTING.md')).toMatch(/GET \| `\/discover\/recommendations`/);
    expect(read('docs/API_ROUTING.md')).toMatch(/surface=crew/);
    expect(read('src/crew-discovery/panel/crewBrowse/CrewBrowseRecommendedBody.tsx')).toMatch(
      /useDiscoverCrewRecommendations/
    );
    expect(read('packages/shared-types/src/recommended-crew-feed.ts')).toMatch(/buildRecommendedCrewFeedRefs/);
    expect(read('src/explore/recommend/resolveExploreMapRecommendationItems.ts')).toMatch(
      /buildExploreMapRecommendations/
    );
    expect(read('packages/shared-types/src/platform-layer-api.ts')).toMatch(/discoverRecommendations/);
  });

  it('REC-03: program registered', () => {
    const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json')) as {
      programs: { programId: string; status: string; scheduleDoc?: string }[];
    };
    const row = registry.programs.find((m) => m.programId === 'MIG-DISCOVER-RECOMMENDATIONS');
    expect(row?.scheduleDoc).toBe('scripts/discover-recommendations-touchpoints.json');
    expect(row?.status).toBe('complete');
  });
});