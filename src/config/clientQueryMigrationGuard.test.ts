import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-CLIENT-QUERY — hooks migrated off mount-fetch must use TanStack Query + clientQueryKeys. */
describe('clientQueryMigrationGuard (MIG-CLIENT-QUERY)', () => {
  it('useExplorePublishedAreas uses publishedAreasQueryKey', () => {
    const content = read('src/explore/useExplorePublishedAreas.ts');
    expect(content).toMatch(/useQuery/);
    expect(content).toMatch(/publishedAreasQueryKey/);
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

  it('My Crews uses useMeBuddiesNetwork', () => {
    const content = read('src/pages/MyCrews.tsx');
    expect(content).toMatch(/useMeBuddiesNetwork/);
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
});
