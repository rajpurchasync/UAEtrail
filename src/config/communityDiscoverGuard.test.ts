import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('communityDiscoverGuard (MIG-COMMUNITY-DISCOVER)', () => {
  it('MIG-COMM-01: API registrar + store separate from member_groups', () => {
    expect(read('apps/api/src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities/);
    expect(read('apps/api/src/lib/community-groups-store.ts')).toMatch(/COMMUNITY_GROUPS/);
    expect(read('apps/api/src/lib/community-groups-store.ts')).not.toMatch(/MEMBER_GROUPS/);
    expect(existsSync(join(ROOT, 'packages/shared-types/src/community-discover.ts'))).toBe(true);
  });

  it('MIG-COMM-02: FE reads explore communities when feature flag on', () => {
    expect(read('src/api/domains/explore.ts')).toMatch(/getExploreCommunities/);
    expect(read('src/api/domains/explore.ts')).toMatch(/getExploreCommunityBySlug/);
    expect(read('src/api/domains/member.ts')).toMatch(/joinDiscoverableCommunity/);
    expect(read('src/hooks/communityDiscoverClientApi.ts')).toMatch(/fetchExploreCommunities/);
    expect(read('src/crew-discovery/hooks/useCommunityDiscoverList.ts')).toMatch(/fetchExploreCommunities/);
    expect(read('src/crew-discovery/hooks/useCommunityDiscoverDetail.ts')).toMatch(/joinDiscoverableCommunity/);
    expect(read('src/list/crews/CrewsCommunityBody.tsx')).toMatch(/communityClubPath/);
    expect(read('src/config/platform.ts')).toMatch(/VITE_COMMUNITY_DISCOVER/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/COMMUNITY_CLUB_PATH_PREFIX/);
  });

  it('MIG-COMM-03: request join + admin seed registrars', () => {
    expect(read('apps/api/src/services/community-discover-commands.ts')).toMatch(/pending/);
    expect(read('apps/api/src/routes/admin/registerAdminCommunityRoutes.ts')).toMatch(/\/communities/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(
      /\/me\/communities\/:communityId\/join/
    );
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_MEMBERS/);
    expect(read('apps/api/src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities\/:slug/);
  });
});