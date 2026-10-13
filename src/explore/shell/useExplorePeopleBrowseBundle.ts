import { useCallback, useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { memberHasUnlimitedDiscovery } from '@uaetrail/shared-types';
import { useEntityFollows } from '../../hooks/useEntityFollows';
import { useMemberPeopleNetworkPreview } from '../useMemberPeopleNetworkPreview';
import { useMemberDiscoveryRoster } from '../useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '../useExplorePeopleAvailability';
import { buildExploreMemberPeopleMapChip } from '../exploreMemberPeopleMapChip';
import type { useExploreBrowseUrlState } from '../ui/useExploreBrowseUrlState';
import type { HostStatusDTO } from '@uaetrail/shared-types';

type BrowseState = ReturnType<typeof useExploreBrowseUrlState>;

type Args = {
  user: { id: string; role?: string } | null;
  hostStatus: HostStatusDTO | null;
  browse: BrowseState;
  mapItems: ExploreMapItemDTO[];
  areaSlug: string | null;
  isDesktop: boolean;
  onOpenExploreActivity: (activity: { exploreItemId: string }) => void;
  searchFocusNonce: number;
};

export const useExplorePeopleBrowseBundle = ({
  user,
  hostStatus,
  browse,
  mapItems,
  areaSlug,
  isDesktop,
  onOpenExploreActivity,
  searchFocusNonce,
}: Args) => {
  const memberPeoplePreview = useMemberPeopleNetworkPreview(Boolean(user));
  const peopleBrowsePanelOpen = browse.listMode === 'people';
  const entityFollows = useEntityFollows(false);
  const memberAvailabilityEnabled = peopleBrowsePanelOpen && browse.peopleBrowseTab === 'available';
  const memberDiscoveryEnabled = peopleBrowsePanelOpen && Boolean(user);
  const memberDiscovery = useMemberDiscoveryRoster({
    enabled: memberDiscoveryEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    omitDirectory: browse.peopleBrowseTab === 'available' || browse.peopleBrowseTab === 'going',
  });
  const peopleAvailability = useExplorePeopleAvailability({
    enabled: memberAvailabilityEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    areaSlug,
    mapFilter: browse.mapFilter,
  });

  const openPeopleBrowsePanel = useCallback(() => {
    browse.openPeopleBrowsePanel('available');
  }, [browse]);

  const peopleBrowseMapChip = useMemo(
    () =>
      buildExploreMemberPeopleMapChip({
        preview: memberPeoplePreview.preview,
        mapItems,
        viewerUserId: user?.id,
        activityDatePreset: browse.activityDatePreset,
      }),
    [memberPeoplePreview.preview, mapItems, user?.id, browse.activityDatePreset]
  );

  const canBrowseAllMembers = memberHasUnlimitedDiscovery(hostStatus);

  const peopleBrowsePanelProps = {
    isDesktop,
    query: browse.query,
    onQueryChange: browse.setQuery,
    onQuerySync: () => browse.syncExploreUrl({ q: browse.query }),
    searchFocusNonce,
    peopleBrowseTab: browse.peopleBrowseTab,
    onPeopleBrowseTabChange: browse.applyPeopleBrowseTab,
    activityDatePreset: browse.activityDatePreset,
    onActivityDatePresetChange: browse.applyActivityDatePreset,
    buddiesDiscoverSegment: browse.buddiesDiscoverSegment,
    onBuddiesDiscoverSegmentChange: browse.applyBuddiesDiscoverSegment,
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
    followedSegment: browse.followedSegment,
    onFollowedSegmentChange: browse.applyFollowedSegment,
    entityFollows: entityFollows.follows,
    entityFollowsLoading: entityFollows.loading,
    entityFollowsError: entityFollows.error,
    isSignedIn: Boolean(user),
    userRole: user?.role,
    canBrowseAllMembers,
    onClose: browse.closePeopleBrowsePanel,
  };

  return {
    peopleBrowsePanelProps,
    openPeopleBrowsePanel,
    peopleBrowseMapChip,
    memberPeoplePreview,
    canBrowseAllMembers,
  };
};
