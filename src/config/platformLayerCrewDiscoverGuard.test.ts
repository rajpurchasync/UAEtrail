import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformLayerCrewDiscoverGuard (PLS-2)', () => {
  it('LAYER-03: roster availability uses fixed catalog path (not map assembly)', () => {
    const roster = read('apps/api/src/services/member-discovery-roster.ts');
    expect(roster).toMatch(/loadDiscoverCrewAvailabilityRows/);
    expect(roster).not.toMatch(/buildMemberDiscoveryAvailabilityRowsFromMapItems/);
    expect(existsSync(join(ROOT, 'apps/api/src/services/discover-crew-availability-rows.ts'))).toBe(true);
  });

  it('LAYER-06: discover feed domain + hook wired', () => {
    expect(existsSync(join(ROOT, 'src/api/domains/crewDiscover.ts'))).toBe(true);
    expect(read('src/crew-discovery/hooks/useCrewDiscoveryRoster.ts')).toMatch(/useCrewDiscoverFeed/);
    expect(read('src/hooks/crewDiscoverClientApi.ts')).toMatch(/fetchDiscoverCrewFeed/);
    expect(read('packages/shared-types/src/crew-discover-feed.ts')).toMatch(/CrewDiscoverFeedDTO/);
  });

  it('LAYER-11: GET /discover/crew registered on member router', () => {
    expect(read('apps/api/src/routes/user/registerDiscoverCrewRoutes.ts')).toMatch(/\/discover\/crew/);
    expect(read('apps/api/src/routes/user/composeUserPublicRoutes.ts')).toMatch(/registerDiscoverCrewRoutes/);
  });
});