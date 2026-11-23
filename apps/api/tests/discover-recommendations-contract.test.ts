import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const apiRoot = process.cwd();
const repoRoot = join(apiRoot, '../..');
const read = (rel: string) => readFileSync(join(apiRoot, rel), 'utf8');
const readRepo = (rel: string) => readFileSync(join(repoRoot, rel), 'utf8');

describe('discover recommendations API contract', () => {
  it('registrar exposes map + crew surfaces on public router with optionalAuth', () => {
    const routes = read('src/routes/user/registerDiscoverRecommendationsRoutes.ts');
    expect(routes).toMatch(/z\.literal\('map'\)/);
    expect(routes).toMatch(/z\.literal\('crew'\)/);
    expect(routes).toMatch(/optionalAuth/);
    expect(routes).toMatch(/loadDiscoverMapRecommendations/);
    expect(routes).toMatch(/loadDiscoverCrewRecommendations/);
  });

  it('loader uses matching rank module', () => {
    expect(read('src/services/discover-map-recommendations.ts')).toMatch(/rankMapExploreActivity/);
    expect(readRepo('packages/shared-types/src/map-explore-recommendation-score.ts')).toMatch(
      /scoreMapExploreActivityCore/
    );
    expect(read('src/services/matching/rank-map-explore.ts')).toMatch(/scoreMapExploreActivityCore/);
    expect(read('src/services/discover-map-recommendations.ts')).toMatch(/rankMapExplorePlace/);
    expect(read('src/services/discover-map-recommendations.ts')).toMatch(/loadRecommendationWishlistContext/);
  });

  it('crew loader uses shared recommended merge', () => {
    expect(read('src/services/discover-crew-recommendations.ts')).toMatch(/buildRecommendedCrewFeedRefs/);
    expect(read('src/services/discover-crew-recommendations.ts')).toMatch(/loadMemberDiscoveryRoster/);
  });
});