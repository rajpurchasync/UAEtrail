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
    expect(read('src/api/domains/explore.ts')).toMatch(/getExploreCommunityActivities/);
    expect(read('src/api/domains/member.ts')).toMatch(/joinDiscoverableCommunity/);
    expect(read('src/api/domains/member.ts')).toMatch(/getMeCommunities/);
    expect(read('src/api/domains/member.ts')).toMatch(/createDiscoverableCommunity/);
    expect(read('src/groups/GroupsCommunitiesSection.tsx')).toMatch(/GroupsCommunitiesSection/);
    expect(read('src/hooks/communityDiscoverClientApi.ts')).toMatch(/fetchExploreCommunities/);
    expect(read('src/crew-discovery/hooks/useCommunityDiscoverList.ts')).toMatch(/fetchExploreCommunities/);
    expect(read('src/crew-discovery/hooks/useCommunityDiscoverDetail.ts')).toMatch(/joinDiscoverableCommunity/);
    expect(read('src/list/crews/CrewsCommunityBody.tsx')).toMatch(/communityClubPath/);
    expect(read('src/config/platform.ts')).toMatch(/VITE_COMMUNITY_DISCOVER/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/COMMUNITY_CLUB_PATH_PREFIX/);
    expect(read('src/pages/CommunityClubDetailPage.tsx')).toMatch(/CommunityClubDetailView/);
    expect(existsSync(join(ROOT, 'src/components/community/CommunityClubDetailView.tsx'))).toBe(true);
  });

  it('MIG-COMM-04: admin console list + detail', () => {
    expect(existsSync(join(ROOT, 'src/pages/admin/Communities.tsx'))).toBe(true);
    expect(read('src/admin/adminNav.ts')).toMatch(/ADMIN_COMMUNITIES_PATH/);
    expect(read('apps/api/src/routes/admin/registerAdminCommunityRoutes.ts')).toMatch(/\/communities\/:id/);
    expect(read('apps/api/src/lib/community-groups-store.ts')).toMatch(/adminUserId/);
  });

  it('MIG-COMM-03: request join + admin seed registrars', () => {
    expect(read('apps/api/src/services/community-discover-commands.ts')).toMatch(/pending/);
    expect(read('apps/api/src/routes/admin/registerAdminCommunityRoutes.ts')).toMatch(/\/communities/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(
      /\/me\/communities\/:communityId\/join/
    );
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_MEMBERS/);
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_INVITES/);
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_ADMINS/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/admins\/:userId/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/status/);
    expect(read('src/components/community/CreateCommunityDialog.tsx')).toMatch(/bannerUrl/);
    expect(read('src/components/community/CommunityHostManageSection.tsx')).toMatch(/addCoAdmin/);
    expect(read('src/api/domains/member.ts')).toMatch(/patchCommunityStatusByHost/);
    expect(read('apps/api/src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities\/:slug/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/leave/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/router\.get\('\/me\/communities'/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/router\.post\(\s*'\s*\/me\/communities'/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/profile/);
    expect(read('packages/shared-types/src/community-discover.ts')).toMatch(/description/);
    expect(read('packages/shared-types/src/community-discover.ts')).toMatch(/viewerIsHost/);
    expect(read('packages/shared-types/src/community-discover.ts')).toMatch(/CommunityDiscoverActivitiesDTO/);
    expect(read('apps/api/src/lib/entity-builders.ts')).toMatch(/discoverCommunityId/);
    expect(read('apps/api/src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/activities/);
    expect(read('apps/api/src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/host-manage/);
    expect(read('apps/api/src/services/community-host-read.ts')).toMatch(/loadCommunityHostManageSurface/);
    expect(read('apps/api/src/services/community-host-notifications.ts')).toMatch(/notifyCommunityMemberApproved/);
    expect(read('src/components/community/CommunityHostManageSection.tsx')).toMatch(/useCommunityHostManage/);
    expect(read('src/api/domains/member.ts')).toMatch(/getCommunityHostManage/);
    expect(read('src/api/domains/member.ts')).toMatch(/approveCommunityMemberByHost/);
    expect(read('apps/api/src/lib/publishing-tenant-activity-schemas.ts')).toMatch(/discoverCommunityId/);
    expect(read('src/explore/ui/HostingCommunityPublishField.tsx')).toMatch(/HostingCommunityPublishField/);
    expect(read('src/config/platform.ts')).toMatch(/VITE_COMMUNITY_DISCOVER=0/);
    expect(read('packages/shared-types/src/index.ts')).toMatch(/discoverCommunityId/);
    expect(read('src/explore/ui/hostingFromActivity.ts')).toMatch(/discoverCommunityId/);
  });
});