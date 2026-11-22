import { useCallback, useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { memberHasUnlimitedDiscovery } from '@uaetrail/shared-types';
import { useCrewDiscoveryAvailabilityCatalog } from './useCrewDiscoveryAvailabilityCatalog';
import { useCrewDiscoveryNetworkPreview } from './useCrewDiscoveryNetworkPreview';
import { useCrewDiscoveryRoster } from './useCrewDiscoveryRoster';
import { useCrewDiscoveryAvailability } from './useCrewDiscoveryAvailability';
import type { useExploreBrowseUrlState } from '@/explore/ui/useExploreBrowseUrlState';
import type { MemberStatusDTO, UserRole } from '@uaetrail/shared-types';
import { buildExploreMemberPeopleMapChip } from '../lib/exploreMemberPeopleMapChip';
import {
  crewBrowseNeedsAvailability,
  crewBrowseOmitDirectory,
  type CrewBrowseState,
} from '@/crew-discovery/crewBrowseState';

type BrowseState = ReturnType<typeof useExploreBrowseUrlState>;

type Args = {
  user: { id: string; role?: string } | null;
  hostStatus: MemberStatusDTO | null;
  browse: BrowseState;
  exploreCatalogItems: ExploreMapItemDTO[];
  areaSlug: string | null;
  isDesktop: boolean;
  mapLoading: boolean;
  onOpenExploreActivity: (activity: { exploreItemId: string }) => void;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  onOpenIntentOpen?: () => void;
  searchFocusNonce: number;
};

export const useCrewDiscoveryBrowseBundle = ({
  user,
  hostStatus,
  browse,
  exploreCatalogItems,
  areaSlug,
  isDesktop,
  mapLoading,
  onOpenExploreActivity,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  onOpenIntentOpen,
  searchFocusNonce,
}: Args) => {
  const crewsBrowsePanelOpen =
    browse.listMode === 'crews' || (isDesktop && browse.crewsBrowseOpen);
  const crewState: CrewBrowseState = {
    lane: browse.crewBrowseLane,
    facet: browse.crewPeopleFacet,
  };
  const networkPreview = useCrewDiscoveryNetworkPreview(Boolean(user) && crewsBrowsePanelOpen);
  const buddyUserIds = useMemo(
    () => (user ? new Set(networkPreview.preview?.friendUserIds ?? []) : undefined),
    [user, networkPreview.preview?.friendUserIds]
  );
  const memberAvailabilityEnabled =
    crewsBrowsePanelOpen && crewBrowseNeedsAvailability(crewState) && Boolean(user);
  const memberDiscoveryEnabled = crewsBrowsePanelOpen && Boolean(user) && crewState.lane === 'people';
  const crewRoster = useCrewDiscoveryRoster({
    enabled: memberDiscoveryEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    omitDirectory: crewBrowseOmitDirectory(crewState),
  });
  const crewAvailability = useCrewDiscoveryAvailability({
    enabled: memberAvailabilityEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
    areaSlug,
    mapFilter: browse.mapFilter,
  });

  const openCrewsBrowsePanel = useCallback(() => {
    browse.openCrewsBrowsePanel('people');
  }, [browse]);

  const availabilityMapCatalogActive =
    crewsBrowsePanelOpen &&
    crewState.lane === 'people' &&
    (crewState.facet === 'available' || crewState.facet === 'recommended');

  const availabilityDiscovery = useCrewDiscoveryAvailabilityCatalog({
    enabled: availabilityMapCatalogActive,
    exploreCatalogFallback: exploreCatalogItems,
    filters: {
      mapFilter: browse.mapFilter,
      buddySubtype: browse.buddySubtype,
      outingTopic: browse.outingTopic,
      query: browse.query,
    },
  });

  const availabilityCatalogItems = availabilityDiscovery.availabilityCatalogItems;

  const crewsBrowseMapChip = useMemo(
    () =>
      buildExploreMemberPeopleMapChip({
        preview: networkPreview.preview,
        mapItems: exploreCatalogItems,
        viewerUserId: user?.id,
        activityDatePreset: browse.activityDatePreset,
      }),
    [networkPreview.preview, exploreCatalogItems, user?.id, browse.activityDatePreset]
  );

  const canBrowseAllMembers = memberHasUnlimitedDiscovery(
    hostStatus ? { hostTiers: hostStatus.publish.hostTiers } : null
  );

  const crewsBrowsePanelProps = {
    isDesktop,
    query: browse.query,
    onQueryChange: browse.setQuery,
    onQuerySync: () => browse.syncExploreUrl({ q: browse.query }),
    onClose: browse.closeCrewsBrowsePanel,
    searchFocusNonce,
    crewBrowseLane: browse.crewBrowseLane,
    crewPeopleFacet: browse.crewPeopleFacet,
    onCrewBrowseLaneChange: browse.applyCrewBrowseLane,
    onCrewPeopleFacetChange: browse.applyCrewPeopleFacet,
    memberPeopleAllCount: networkPreview.preview?.allCount,
    memberPeopleFriendsCount: networkPreview.preview?.friendCount,
    memberPeopleFollowedCount: networkPreview.preview?.followedCount,
    memberPeopleNetwork: [],
    memberPeopleLoading: false,
    memberPeopleError: null,
    onRefreshMemberPeople: () => {},
    onOpenMemberPersonActivity: onOpenExploreActivity,
    discoveryFriendsGoing: crewRoster.friendsGoing,
    discoveryHostsGoing: crewRoster.hostsGoing,
    discoveryAvailabilityOnMap: crewRoster.availabilityOnMap,
    discoveryFollowed: crewRoster.followed,
    discoveryDirectory: crewRoster.directory,
    discoveryQuota: crewRoster.quota,
    discoveryLoading: crewRoster.loading,
    discoveryError: crewRoster.error,
    onRefreshMemberDiscovery: () => void crewRoster.refresh(),
    availabilityPeople: crewAvailability.people,
    availabilityLoading: crewAvailability.loading,
    availabilityError: crewAvailability.error,
    availabilityRange: crewAvailability.range,
    onRefreshAvailability: () => void crewAvailability.refresh(),
    isSignedIn: Boolean(user),
    userRole: user?.role as UserRole | undefined,
    canBrowseAllMembers,
    availabilityCatalogItems,
    exploreCatalogItems,
    exploreCatalogLoading: mapLoading || availabilityDiscovery.loading,
    onOpenAvailabilityCatalogItem,
    onOfferRideshareForAvailabilityItem,
    onOpenIntentOpen,
    buddyUserIds,
  };

  return {
    crewsBrowsePanelProps,
    openCrewsBrowsePanel,
    crewsBrowseMapChip,
    memberPeoplePreview: networkPreview,
    canBrowseAllMembers,
  };
};