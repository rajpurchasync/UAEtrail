import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-CLIENT-QUERY — hooks migrated off mount-fetch must use TanStack Query + clientQueryKeys. */
describe('clientQueryMigrationGuard (MIG-CLIENT-QUERY)', () => {
  it('useSafeAsyncEffect mount-fetch hook is removed', () => {
    expect(existsSync(join(ROOT, 'src/hooks/useSafeAsyncEffect.ts'))).toBe(false);
  });
  it('useExplorePublishedDestinations uses publishedDestinationsQueryKey', () => {
    const content = read('src/explore/useExplorePublishedDestinations.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/publishedDestinationsQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useHomeLandingActivities uses homeLandingActivitiesQueryKey', () => {
    const content = read('src/hooks/useHomeLandingActivities.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/homeLandingActivitiesQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useExploreEntityFollow uses entityFollowStateQueryKey', () => {
    const content = read('src/explore/ui/useExploreEntityFollow.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/entityFollowStateQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useExploreWishlistSave uses wishlistTargetStateQueryKey', () => {
    const content = read('src/explore/ui/useExploreWishlistSave.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/wishlistTargetStateQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useMeNotificationsInbox uses meNotificationsPageQueryKey', () => {
    const content = read('src/hooks/useMeNotificationsInbox.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/meNotificationsPageQueryKey/);
  });

  it('ShopPublic uses shopPublicPageQueryKey', () => {
    const content = read('src/pages/ShopPublic.tsx');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/shopPublicPageQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useMemberBadges uses memberBadgesQueryKey', () => {
    const content = read('src/hooks/useMemberBadges.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/memberBadgesQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('HostingPublishSuccessSheet uses usePublicActivityDetail', () => {
    const content = read('src/explore/ui/HostingPublishSuccessSheet.tsx');
    expect(content).toMatch(/usePublicActivityDetail/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
    expect(content).toMatch(/HOSTING_PUBLISH_SHARE_CTA/);
    expect(content).toMatch(/LinkRidesharePanel/);
    expect(content).toMatch(/LinkParentActivityPanel/);
    expect(content).toMatch(/pickExisting/);
  });

  it('ProfileEdit uses useMeProfile', () => {
    const content = read('src/pages/ProfileEdit.tsx');
    expect(content).toMatch(/useMeProfile/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('Profile uses me profile query hooks', () => {
    const content = read('src/pages/Profile.tsx');
    expect(content).toMatch(/useMeProfileStats/);
    expect(content).toMatch(/useMemberBadges/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('useMemberProfilePage uses person public profile query keys', () => {
    const content = read('src/hooks/useMemberProfilePage.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/personPublicProfileQueryKey/);
    expect(content).toMatch(/memberPublicProfileApi/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('MemberProfile uses useMemberProfilePage', () => {
    const content = read('src/pages/MemberProfile.tsx');
    expect(content).toMatch(/useMemberProfilePage/);
    expect(content).toMatch(/memberPublicProfileApi/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('My Crews uses useMeFriendsNetwork', () => {
    const content = read('src/pages/MyCrews.tsx');
    expect(content).toMatch(/useMeFriendsNetwork/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('ActivityDetail uses useActivityHostJoinRequests', () => {
    const content = read('src/pages/ActivityDetail.tsx');
    expect(content).toMatch(/useActivityHostJoinRequests/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('Messages uses useMessagesInbox', () => {
    const content = read('src/pages/Messages.tsx');
    expect(content).toMatch(/useMessagesInbox/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('JourneyMapPage uses useMemberJourneyMap', () => {
    const content = read('src/pages/JourneyMapPage.tsx');
    expect(content).toMatch(/useMemberJourneyMap/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('usePlaceDetailCore uses placeDetailCoreQueryKey', () => {
    const content = read('src/hooks/usePlaceDetailPage.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/placeDetailCoreQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('member profile hooks use client query keys', () => {
    expect(read('src/hooks/useMemberStatus.ts')).toMatch(/memberStatusQueryKey/);
    expect(read('src/hooks/useMemberGoals.ts')).toMatch(/memberGoalsQueryKey/);
    expect(read('src/hooks/useMemberAvailability.ts')).toMatch(/memberAvailabilityQueryKey/);
  });

  it('FacilityDetailPage uses usePublicFacilityDetail', () => {
    const content = read('src/pages/FacilityDetailPage.tsx');
    expect(content).toMatch(/usePublicFacilityDetail/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('Admin Alerts uses useAdminAlertsSafetyData', () => {
    const content = read('src/pages/admin/Alerts.tsx');
    expect(content).toMatch(/useAdminAlertsSafetyData/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
    expect(read('src/hooks/useAdminAlertsSafetyData.ts')).toMatch(/adminAlertsSafetyQueryKey/);
  });

  const adminConsolePageAssertions: Array<{ page: string; hook: string; queryKey: string }> = [
    { page: 'src/pages/admin/Settings.tsx', hook: 'useAdminNotificationBroadcasts', queryKey: 'adminNotificationBroadcastsQueryKey' },
    { page: 'src/pages/admin/Notifications.tsx', hook: 'useAdminNotificationsConsole', queryKey: 'adminNotificationsConsoleQueryKey' },
    { page: 'src/pages/admin/Account.tsx', hook: 'useAdminStaffProfile', queryKey: 'adminStaffProfileQueryKey' },
    { page: 'src/pages/admin/AuditLog.tsx', hook: 'useAdminAuditLogs', queryKey: 'adminAuditLogsQueryKey' },
    { page: 'src/pages/admin/Communities.tsx', hook: 'useAdminCommunitiesList', queryKey: 'adminCommunitiesListQueryKey' },
    { page: 'src/pages/admin/Groups.tsx', hook: 'useAdminSocialGroupsCatalog', queryKey: 'adminSocialGroupsCatalogQueryKey' },
    { page: 'src/pages/admin/Reports.tsx', hook: 'useAdminContentReports', queryKey: 'adminContentReportsQueryKey' },
    { page: 'src/pages/admin/Inbox.tsx', hook: 'useAdminInboxDashboard', queryKey: 'adminInboxDashboardQueryKey' },
    { page: 'src/pages/admin/Submissions.tsx', hook: 'useAdminSubmissionsQueue', queryKey: 'adminSubmissionsQueueQueryKey' },
    { page: 'src/pages/admin/Destinations.tsx', hook: 'useAdminDestinationsCatalog', queryKey: 'adminDestinationsCatalogQueryKey' },
    { page: 'src/pages/admin/Members.tsx', hook: 'useAdminMembersList', queryKey: 'adminMembersQueryKey' },
    { page: 'src/pages/admin/Operators.tsx', hook: 'useAdminOrganisationsCatalog', queryKey: 'adminOrganisationsCatalogQueryKey' },
    { page: 'src/pages/admin/Activities.tsx', hook: 'useAdminModerationActivitiesCatalog', queryKey: 'adminModerationActivitiesCatalogQueryKey' },
    { page: 'src/pages/admin/Places.tsx', hook: 'useAdminPlacesCatalogAll', queryKey: 'adminPlacesCatalogAllQueryKey' },
  ];

  for (const { page, hook, queryKey } of adminConsolePageAssertions) {
    it(`${page} uses ${hook}`, () => {
      const content = read(page);
      expect(content).toMatch(new RegExp(hook));
      expect(content).not.toMatch(/useSafeAsyncEffect/);
      expect(read('src/hooks/clientQueryKeys.ts')).toMatch(new RegExp(queryKey));
    });
  }

  const operatorConsolePageAssertions: Array<{ page: string; hook: string; queryKey: string }> = [
    { page: 'src/operator/desk/Places.tsx', hook: 'useWorkspaceSubmittedPlaces', queryKey: 'workspaceSubmittedPlacesQueryKey' },
    { page: 'src/operator/desk/Team.tsx', hook: 'useWorkspaceTeam', queryKey: 'workspaceTeamQueryKey' },
    { page: 'src/operator/desk/PublicProfileEdit.tsx', hook: 'useMyTenantMemberships', queryKey: 'myTenantMembershipsQueryKey' },
  ];

  for (const { page, hook, queryKey } of operatorConsolePageAssertions) {
    it(`${page} uses ${hook}`, () => {
      const content = read(page);
      expect(content).toMatch(new RegExp(hook));
      expect(content).not.toMatch(/useSafeAsyncEffect/);
      expect(read('src/hooks/clientQueryKeys.ts')).toMatch(new RegExp(queryKey));
    });
  }

  it('useAdminInboxBadges uses TanStack Query', () => {
    const content = read('src/hooks/useAdminInboxBadges.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/adminInboxNavBadgesQueryKey/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
  });

  it('ConsoleShell loads rating via useOperatorDeskRating', () => {
    const content = read('src/operator/desk/ConsoleShell.tsx');
    expect(content).toMatch(/useOperatorDeskRating/);
    expect(content).not.toMatch(/useSafeAsyncEffect/);
    expect(read('src/hooks/useOperatorConsoleQueries.ts')).toMatch(/operatorDeskRatingQueryKey/);
  });

  it('W6c surfaces use TanStack Query (no mount useSafeAsyncEffect)', () => {
    const cases: Array<{ file: string; pattern: RegExp }> = [
      { file: 'src/components/admin/UserDetailPanel.tsx', pattern: /useAdminTenantDetail/ },
      { file: 'src/components/profile/ProfileVerificationDocs.tsx', pattern: /useMyVerificationDocuments/ },
      { file: 'src/explore/ui/AvailabilityFixedSubmitSuccessSheet.tsx', pattern: /usePublicActivityDetail/ },
      { file: 'src/explore/ui/peek/place/PlacePeekBody.tsx', pattern: /usePlacePublishedActivitiesCount/ },
      { file: 'src/explore/ui/peek/place/PlaceMapPeekScheduledRow.tsx', pattern: /usePlacePublishedActivitiesCount/ },
    ];
    for (const { file, pattern } of cases) {
      const content = read(file);
      expect(content).toMatch(pattern);
      expect(content).not.toMatch(/useSafeAsyncEffect/);
    }
    expect(read('src/hooks/clientQueryKeys.ts')).toMatch(/placePublishedActivitiesCountQueryKey/);
    expect(read('src/hooks/clientQueryKeys.ts')).toMatch(/myVerificationDocumentsQueryKey/);
    expect(read('src/hooks/clientQueryKeys.ts')).toMatch(/adminGroupDetailQueryKey/);
  });
});
