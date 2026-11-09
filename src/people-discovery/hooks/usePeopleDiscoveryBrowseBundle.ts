import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { memberHasUnlimitedDiscovery } from '@uaetrail/shared-types';
import { usePeopleDiscoverySeekingActivities } from './usePeopleDiscoverySeekingActivities';
import { useMemberPeopleNetworkPreview } from './useMemberPeopleNetworkPreview';
import { useMemberDiscoveryRoster } from './useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from './usePeopleAvailability';
import type { useExploreBrowseUrlState } from '@/explore/ui/useExploreBrowseUrlState';
import type { MemberStatusDTO, UserRole } from '@uaetrail/shared-types';

type BrowseState = ReturnType<typeof useExploreBrowseUrlState>;

type Args = {
  user: { id: string; role?: string } | null;
  hostStatus: MemberStatusDTO | null;
  browse: BrowseState;
  /** Published explore catalog (`GET /explore/map` → `ExploreMapItemDTO[]`). */
  exploreCatalogItems: ExploreMapItemDTO[];
  areaSlug: string | null;
  isDesktop: boolean;
  mapLoading: boolean;
  onOpenExploreActivity: (activity: { exploreItemId: string }) => void;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  searchFocusNonce: number;
};

export const useExplorePeopleBrowseBundle = ({
  user,
  hostStatus,
  browse,
  exploreCatalogItems,
  areaSlug,
  isDesktop,
  mapLoading,
  onOpenExploreActivity,
  onOpenSeekingActivity,
  searchFocusNonce,
}: Args) => {
  const peopleBrowsePanelOpen =
    browse.listMode === 'people' || (isDesktop && browse.peopleBrowseOpen);
  const memberPeoplePreview = useMemberPeopleNetworkPreview(Boolean(user) && peopleBrowsePanelOpen);
  const buddyUserIds = useMemo(
    () => (user ? new Set(memberPeoplePreview.preview?.friendUserIds ?? []) : undefined),
    [user, memberPeoplePreview.preview?.friendUserIds]
  );
  const memberAvailabilityEnabled =
    peopleBrowsePanelOpen && browse.peopleBrowseTab === 'available' && Boolean(user);
  const memberDiscoveryEnabled =
    peopleBrowsePanelOpen &&
    Boolean(user) &&
    (browse.peopleBrowseTab === 'going' || browse.peopleBrowseTab === 'connect');
  const memberDiscovery = useMemberDiscoveryRoster({
    enabled: memberDiscoveryEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    omitDirectory: browse.peopleBrowseTab === 'going',
  });
  const peopleAvailability = useExplorePeopleAvailability({
    enabled: memberAvailabilityEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    areaSlug,
    mapFilter: browse.mapFilter,
  });

  const peopleLookingTabActive =
    peopleBrowsePanelOpen && browse.peopleBrowseTab === 'looking';

  const seekingDiscovery = usePeopleDiscoverySeekingActivities({
    enabled: peopleLookingTabActive,
    exploreCatalogFallback: exploreCatalogItems,
    filters: {
      mapFilter: browse.mapFilter,
      buddySubtype: browse.buddySubtype,
      outingTopic: browse.outingTopic,
      query: browse.query,
    },
  });

  const seekingActivities = seekingDiscovery.seekingActivities;

  const canBrowseAllMembers = memberHasUnlimitedDiscovery(
    hostStatus ? { hostTiers: hostStatus.publish.hostTiers } : null
  );

  const peopleBrowsePanelProps = {
    isDesktop,
    query: browse.query,
    onQueryChange: browse.setQuery,
    onQuerySync: () => browse.syncExploreUrl({ q: browse.query }),
    onClose: browse.closePeopleBrowsePanel,
    searchFocusNonce,
    peopleBrowseTab: browse.peopleBrowseTab,
    onPeopleBrowseTabChange: browse.applyPeopleBrowseTab,
    memberPeopleAllCount: memberPeoplePreview.preview?.allCount,
    memberPeopleFriendsCount: memberPeoplePreview.preview?.friendCount,
    memberPeopleFollowedCount: memberPeoplePreview.preview?.followedCount,
    memberPeopleNetwork: [],
    memberPeopleLoading: false,
    memberPeopleError: null,
    onRefreshMemberPeople: () => {},
    onOpenMemberPersonActivity: onOpenExploreActivity,
    discoveryFriendsGoing: memberDiscovery.friendsGoing,
    discoveryHostsGoing: memberDiscovery.hostsGoing,
    discoverySeekingOnMap: memberDiscovery.seekingOnMap,
    discoveryFollowed: memberDiscovery.followed,
    discoveryDirectory: memberDiscovery.directory,
    discoveryQuota: memberDiscovery.quota,
    discoveryLoading: memberDiscovery.loading,
    discoveryError: memberDiscovery.error,
    onRefreshMemberDiscovery: () => void memberDiscovery.refresh(),
    availabilityPeople: peopleAvailability.people,
    availabilityLoading: peopleAvailability.loading,
    availabilityError: peopleAvailability.error,
    availabilityRange: peopleAvailability.range,
    onRefreshAvailability: () => void peopleAvailability.refresh(),
    isSignedIn: Boolean(user),
    userRole: user?.role as UserRole | undefined,
    canBrowseAllMembers,
    seekingActivities,
    exploreCatalogItems,
    exploreCatalogLoading: mapLoading || seekingDiscovery.loading,
    onOpenSeekingActivity,
    buddyUserIds,
  };

  return {
    peopleBrowsePanelProps,
    memberPeoplePreview,
    canBrowseAllMembers,
  };
};
