import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { describeExploreMapLoadError } from '../exploreMapErrors';
import { PageMeta } from '../../components/seo/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { useHostStatus } from '../../hooks/useHostStatus';
import { useExploreMap, reloadExploreMap } from '../../hooks/useExploreMap';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { getExploreMapTiles } from '../../config/platform';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { ListFeedActionsProvider } from '../../list/ui/ListFeedActionsProvider';
import { ExploreComposeHost } from './ExploreComposeHost';
import { ExploreJoinOverlays } from './ExploreJoinOverlays';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { ExploreBrowseSearchModal } from './ExploreBrowseSearchModal';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreBrowsePanel } from './ExploreBrowsePanel';
import { ExploreMapStage } from './ExploreMapStage';
import { ExploreMobileBrowseOverlay } from './ExploreMobileBrowseOverlay';
import { useExploreBrowseList } from './useExploreBrowseList';
import { useEntityFollows } from '../../hooks/useEntityFollows';
import { useSocialPeople } from '../useSocialPeople';
import { useSocialPeoplePreview } from '../useSocialPeoplePreview';
import { useMemberDiscoveryRoster } from '../useMemberDiscoveryRoster';
import { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import { useExploreComposeRoute } from './useExploreComposeRoute';
import { useExploreFulfillIntent } from './useExploreFulfillIntent';
import { useExploreOrganizeFromActivity } from './useExploreOrganizeFromActivity';
import type { OrganizeWizardPrefill } from './organizeWizardPrefill';
import { api } from '../../api/index';
import { buildExploreCardModel } from '../exploreCardModel';
import {
  createDraftFromRegistryPlace,
  resolveOrganizeComposeKindFromVenueCardKind,
  resolveCreateActivityKindFromVenueCardKind,
} from './organizeFromPlace';
import type { CreateActivityDraft } from './organizeFlow';
import {
  organizePublishGateHref,
  organizePublishGateInputFromHostGate,
} from '../../utils/organizePublishGate';
import { buildRideshareDraftFromDemandMapItem, buildRideshareDraftFromParentActivity } from '../linkRidesharePrefill';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { HostActivityCancelDialog } from '../../components/activity/HostActivityCancelDialog';
import { hostActivityCancelParticipantNotice } from '../../host/hostActivityCancelParticipantNotice';
import { hostActivityCtaHandlers as buildHostActivityCtaHandlers } from '../../host/hostActivityCtaHandlers';
import { useExploreMapViewport } from './useExploreMapViewport';
import { useExploreSelectionActions } from './useExploreSelectionActions';
import {
  EXPLORE_JOIN_INVITE_QUERY_KEY,
  MY_TRIPS_QUERY_KEY,
  PLAN_WITH_QUERY_KEY,
  parseExploreJoinInvitePeek,
  parseExplorePinMapItemId,
  parseOrganizeFromActivityId,
  parsePlanWithUserId,
} from '../routing';
import { activityJoinInviteBanner } from '../../content/exploreGoingPanelCopy';
import { useMemberJourneyMapPinIds } from '../../hooks/useMemberJourneyMapPinIds';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { Dialog } from '../../components/ui/Dialog';
import { AppButton } from '../../components/mobile/AppButton';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';

export const ExploreExperience = () => {
  const { user } = useAuth();
  const {
    canPublish,
    signupProfileComplete,
    isCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    tenantId,
    refresh: refreshHostGate,
  } = useHostStatus({
    enabled: Boolean(user),
  });
  const navigate = useNavigate();
  const navigateOrganizePublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        organizePublishGateHref(
          returnPath,
          organizePublishGateInputFromHostGate({
            viewerUserId: user?.id ?? null,
            signupProfileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, signupProfileComplete, canPublish, isCommunityHost, hostTiers]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pathname, search, state: locationState } = useLocation();
  const isDesktop = useMinWidthLg();
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap();
  const myTripsMode = searchParams.get(MY_TRIPS_QUERY_KEY) === '1';
  const { ids: myTripsPinIds, loading: myTripsPinsLoading } = useMemberJourneyMapPinIds(
    myTripsMode ? user?.id : undefined
  );
  const mapItems = useMemo(() => {
    if (!myTripsMode) return items;
    if (!myTripsPinIds) return [];
    return items.filter((item) => myTripsPinIds.has(item.id));
  }, [items, myTripsMode, myTripsPinIds]);
  const mapLoading = loading || (myTripsMode && myTripsPinsLoading);
  const loadError = mapError ? describeExploreMapLoadError(mapError) : null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkOnlyPeekItems, setLinkOnlyPeekItems] = useState<ExploreMapItemDTO[]>([]);
  const [rideshareLinkParent, setRideshareLinkParent] = useState<ActivityDTO | null>(null);
  const [rideshareLinkDemand, setRideshareLinkDemand] = useState<ExploreMapItemDTO | null>(null);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const browse = useExploreBrowseUrlState({
    isDesktop,
    searchParams,
    setSearchParams,
    clearSelection,
  });

  const viewport = useExploreMapViewport({
    user,
    locationState,
    pathname,
    search,
    navigate,
  });

  const compose = useExploreComposeRoute({
    user,
    navigate,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: clearSelection,
    canPublish,
    signupProfileComplete,
    hostGateLoading,
  });

  const selectionItems = useMemo(() => {
    const ids = new Set(mapItems.map((entry) => entry.id));
    const extra = linkOnlyPeekItems.filter((entry) => !ids.has(entry.id));
    return extra.length > 0 ? [...mapItems, ...extra] : mapItems;
  }, [mapItems, linkOnlyPeekItems]);

  const selected = selectionItems.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!myTripsMode || user) return;
    const { href } = buildSignInRedirect({ pathname, search });
    navigate(href, { replace: true });
  }, [myTripsMode, user, navigate, pathname, search]);

  useExploreFulfillIntent({
    searchParams,
    setSearchParams,
    setSelectedId,
  });

  const [organizeFromPlacePrefill, setOrganizeFromPlacePrefill] = useState<CreateActivityDraft | null>(
    null
  );

  const organizeFrom = useExploreOrganizeFromActivity({
    user,
    tenantId,
    hostGateLoading,
    canPublish,
    signupProfileComplete,
    isCommunityHost,
    hostTiers,
    navigate,
    pathname,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    organizeKind: compose.organizeRoute?.kind ?? null,
  });

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkDemand(null);
      setRideshareLinkParent(parent);
      setSelectedId(null);
      compose.setComposeRoute({ intent: 'organize', kind: 'rideshare' });
    },
    [compose.setComposeRoute]
  );

  const handleOfferRideshareForDemand = useCallback(() => {
    if (!selected || selected.source !== 'demand') return;

    const returnPath = `${pathname}${search}`;

    if (!user) {
      navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (hostGateLoading) return;
    if (!canPublish) {
      navigateOrganizePublishGate(returnPath);
      return;
    }

    setRideshareLinkParent(null);
    setRideshareLinkDemand(selected);
    setSelectedId(null);
    compose.setComposeRoute({ intent: 'organize', kind: 'rideshare' });
  }, [
    selected,
    pathname,
    search,
    user,
    hostGateLoading,
    navigateOrganizePublishGate,
    compose.setComposeRoute,
  ]);

  const organizeWizardPrefill = useMemo((): OrganizeWizardPrefill | null => {
    if (rideshareLinkParent) {
      return {
        draft: buildRideshareDraftFromParentActivity(rideshareLinkParent),
        linkToParentActivityId: rideshareLinkParent.id,
      };
    }
    if (rideshareLinkDemand) {
      return {
        draft: buildRideshareDraftFromDemandMapItem(rideshareLinkDemand),
        participantIntentId: rideshareLinkDemand.participantIntentId ?? undefined,
      };
    }
    if (organizeFrom.organizeFromPrefill) {
      return {
        draft: organizeFrom.organizeFromPrefill.draft,
        sourceActivityId: organizeFrom.organizeFromPrefill.sourceActivityId,
      };
    }
    if (organizeFromPlacePrefill) {
      return { draft: organizeFromPlacePrefill };
    }
    return null;
  }, [
    rideshareLinkParent,
    rideshareLinkDemand,
    organizeFrom.organizeFromPrefill,
    organizeFromPlacePrefill,
  ]);

  const inviteShare = useActivityInviteShareSheet();
  const planWithBuddyUserId = parsePlanWithUserId(searchParams);
  const [joinInvitePeekActivityId, setJoinInvitePeekActivityId] = useState<string | null>(null);

  const selection = useExploreSelectionActions({
    items: selectionItems,
    selectedId,
    setSelectedId,
    user,
    tenantId,
    navigate,
    queryClient,
    browse,
    isDesktop,
    closeCompose: compose.closeCompose,
    handleFocusMapLocation: viewport.handleFocusMapLocation,
    setLinkOnlyPeekItems,
    onInviteActivity: inviteShare.openInviteFromActivity,
    onCreateLinkedRideshare: handleCreateLinkedRideshare,
  });

  const joinInvitePeekBanner = useMemo(() => {
    if (!joinInvitePeekActivityId || !selection.selectedCard) return null;
    if (selection.selectedCard.source !== 'activity') return null;
    if (selection.selectedCard.activityId !== joinInvitePeekActivityId) return null;
    if (selection.peekJoinUiState?.kind === 'confirmed') return null;
    return activityJoinInviteBanner();
  }, [joinInvitePeekActivityId, selection.selectedCard, selection.peekJoinUiState]);

  const handleCloseMapSelection = useCallback(() => {
    setJoinInvitePeekActivityId(null);
    selection.handleCloseSelection();
  }, [selection]);

  const hostActivityCtaHandlers = useMemo(() => {
    if (!selection.selectedCard?.showHostActivityCtas || !selection.selected?.activity) return null;
    return buildHostActivityCtaHandlers({
      activity: selection.selected.activity,
      navigate,
      onInviteActivity: inviteShare.openInviteFromActivity,
      onCreateLinkedRideshare: handleCreateLinkedRideshare,
      onRequestDelete: selection.requestHostRemove,
      onBeforeNavigate: handleCloseMapSelection,
      onChatError: (message) => selection.setDemandNotice(message),
    });
  }, [
    selection.selectedCard?.showHostActivityCtas,
    selection.selected?.activity,
    selection.requestHostRemove,
    selection.setDemandNotice,
    navigate,
    inviteShare.openInviteFromActivity,
    handleCreateLinkedRideshare,
    handleCloseMapSelection,
  ]);

  const hostRemoveParticipantNotice = useMemo(() => {
    const activity = selection.hostRemoveConfirm;
    if (!activity) return null;
    return hostActivityCancelParticipantNotice(
      activity,
      selection.selectedCard?.participantPreviews
    );
  }, [selection.hostRemoveConfirm, selection.selectedCard?.participantPreviews]);

  const organizeFromPending = Boolean(parseOrganizeFromActivityId(searchParams));
  const organizeWizardOpen =
    Boolean(organizeWizardPrefill) ||
    (Boolean(compose.organizeRoute) && !organizeFromPending);

  const deepLinkPinId = parseExplorePinMapItemId(searchParams);
  const openedDeepLinkPinRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deepLinkPinId?.startsWith('demand:') || rideshareLinkDemand || loading) return;
    if (compose.organizeRoute?.kind !== 'rideshare') return;
    const item = selectionItems.find((entry) => entry.id === deepLinkPinId);
    if (item?.source === 'demand') {
      setRideshareLinkDemand(item);
    }
  }, [
    deepLinkPinId,
    rideshareLinkDemand,
    loading,
    compose.organizeRoute?.kind,
    selectionItems,
  ]);

  useEffect(() => {
    if (!deepLinkPinId || loading) return;
    if (openedDeepLinkPinRef.current === deepLinkPinId) return;

    const joinInviteFromUrl = parseExploreJoinInvitePeek(searchParams);

    const clearPinParam = () => {
      openedDeepLinkPinRef.current = deepLinkPinId;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('pin');
          next.delete(EXPLORE_JOIN_INVITE_QUERY_KEY);
          return next;
        },
        { replace: true }
      );
    };

    const captureJoinInvitePeek = () => {
      if (!joinInviteFromUrl || !deepLinkPinId.startsWith('activity:')) return;
      setJoinInvitePeekActivityId(deepLinkPinId.slice('activity:'.length));
    };

    const item = selectionItems.find((entry) => entry.id === deepLinkPinId);
    if (item) {
      selection.openItem(item);
      captureJoinInvitePeek();
      clearPinParam();
      return;
    }

    void selection.tryOpenActivityPinDeepLink(deepLinkPinId).then((result) => {
      if (result === 'opened') {
        captureJoinInvitePeek();
        clearPinParam();
        return;
      }
      if (result === 'auth_required') {
        navigate(buildSignInRedirect({ pathname, search }).href);
      }
    });
  }, [
    deepLinkPinId,
    loading,
    selectionItems,
    selection.openItem,
    selection.tryOpenActivityPinDeepLink,
    setSearchParams,
    navigate,
    pathname,
    search,
  ]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const socialPeoplePreview = useSocialPeoplePreview(Boolean(user));
  const socialPanelOpen = Boolean(user) && browse.listMode === 'social';
  const entityFollowsEnabled =
    socialPanelOpen && browse.socialTab === 'followed' && browse.followedSegment !== 'people';
  const entityFollows = useEntityFollows(entityFollowsEnabled);
  const socialPeopleEnabled =
    socialPanelOpen &&
    browse.socialTab !== 'discover' &&
    !(browse.socialTab === 'followed' && browse.followedSegment !== 'people');
  const memberDiscoveryEnabled = socialPanelOpen && browse.socialTab === 'discover';
  const socialPeople = useSocialPeople({
    enabled: socialPeopleEnabled,
    segment:
      browse.socialTab === 'friends' || browse.socialTab === 'followed'
        ? browse.socialTab
        : 'all',
  });
  const memberDiscovery = useMemberDiscoveryRoster({
    enabled: memberDiscoveryEnabled,
    search: browse.query,
    activityDatePreset: browse.activityDatePreset,
  });

  const openSocialPanel = useCallback(() => {
    browse.openSocialPanel('all');
  }, [browse]);

  const openExploreActivityFromRef = useCallback(
    (activity: { exploreItemId: string }) => {
      const item = mapItems.find((entry) => entry.id === activity.exploreItemId);
      if (item) selection.openItem(item);
    },
    [mapItems, selection]
  );

  const openDiscoveryActivityOnMap = useCallback(
    (activityId: string) => {
      const exploreItemId = `activity:${activityId}`;
      const item = mapItems.find((entry) => entry.id === exploreItemId);
      if (item) selection.openItem(item);
    },
    [mapItems, selection]
  );

  const {
    mapPins,
    shopListSections,
    searchScopeCounts,
  } =
    useExploreBrowseList({
      items: mapItems,
      ephemeralMapItems: linkOnlyPeekItems,
      mapFilter: browse.mapFilter,
      venueRegions: browse.venueRegions,
      query: browse.query,
      activityDatePreset: browse.activityDatePreset,
      listMode: browse.listMode,
      searchScope: browse.searchScope,
      sidebarPanel: browse.sidebarPanel,
      isDesktop,
      desktopBrowseTab: browse.desktopBrowseTab,
      buddySubtype: browse.buddySubtype,
      outingTopic: browse.outingTopic,
    });

  const socialPanelMapChip = useMemo(() => {
    const preview = socialPeoplePreview.preview;
    const avatars = (preview?.avatars ?? []).map((person) => ({
      id: person.userId,
      name: person.displayName,
      avatar: person.avatarUrl,
    }));
    const friendCount = preview?.friendCount ?? 0;
    return {
      avatars,
      extraCount: Math.max(0, friendCount - avatars.length),
      friendCount,
    };
  }, [socialPeoplePreview.preview]);

  const exploreMapTiles = useMemo(
    () => getExploreMapTiles(viewport.exploreMapStyle),
    [viewport.exploreMapStyle]
  );

  const reloadMap = () => {
    void reloadExploreMap(queryClient);
  };

  const handleMapPinClick = useCallback(
    (pin: PlaceMapPin) => {
      const stack = pin.stackExploreItemIds;
      const itemId =
        (stack?.find((id) => id === selectedId) ?? stack?.[0]) ?? pin.exploreItemId ?? pin.id;
      const item = selectionItems.find((entry) => entry.id === itemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selectedId, selection]
  );

  const closeCreateFlow = () => {
    compose.closeCompose();
    organizeFrom.clearOrganizeFromPrefill();
    setOrganizeFromPlacePrefill(null);
    setRideshareLinkParent(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PLAN_WITH_QUERY_KEY);
        return next;
      },
      { replace: true }
    );
  };

  const handlePlanTripFromVenue = useCallback(
    async (item: ExploreMapItemDTO) => {
      const returnPath = `${pathname}${search}`;
      if (!user) {
        navigate(buildSignInRedirect({ pathname, search }).href);
        return;
      }
      if (hostGateLoading) return;
      if (!canPublish) {
        navigateOrganizePublishGate(returnPath);
        return;
      }

      const placeId = item.locationCard?.id;
      if (!placeId) return;

      const card = buildExploreCardModel(item);
      const composeKind = resolveOrganizeComposeKindFromVenueCardKind(card.kind);
      const createKind = resolveCreateActivityKindFromVenueCardKind(card.kind);
      compose.setComposeRoute({ intent: 'organize', kind: composeKind });

      try {
        const { data } = await api.getPublicPlaceDetail(placeId);
        setOrganizeFromPlacePrefill(createDraftFromRegistryPlace(data, createKind));
      } catch {
        compose.closeCompose();
      }
    },
    [
      pathname,
      search,
      user,
      hostGateLoading,
      canPublish,
      signupProfileComplete,
      navigate,
      compose.setComposeRoute,
      compose.closeCompose,
    ]
  );

  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [exploreSearchModalOpen, setExploreSearchModalOpen] = useState(false);

  const handleExploreSearchCommit = useCallback(
    (scope?: ExploreSearchScopeKey | null) => {
      browse.commitExploreSearch(scope);
      setSearchFocusNonce((n) => n + 1);
    },
    [browse]
  );

  const browsePanelShared = {
    isDesktop,
    loading: mapLoading,
    myTripsMode,
    shopListSections,
    desktopBrowseTab: browse.desktopBrowseTab,
    mapFilter: browse.mapFilter,
    browseFilterKeys: browse.browseFilterKeys,
    placesMode: browse.placesMode,
    onMapFilterChange: browse.applyMapFilter,
    activityDatePreset: browse.activityDatePreset,
    onActivityDatePresetChange: browse.applyActivityDatePreset,
    venueRegions: browse.venueRegions,
    onVenueRegionsChange: browse.applyVenueRegions,
    onDesktopBrowseTabChange: browse.applyDesktopBrowseTab,
    panel: browse.panel,
    sidebarPanel: browse.sidebarPanel,
    onPanelChange: browse.applyPanel,
    buddySubtype: browse.buddySubtype,
    onBuddySubtypeChange: browse.applyBuddySubtype,
    outingTopic: browse.outingTopic,
    onOutingTopicChange: browse.applyOutingTopic,
    query: browse.query,
    onQueryChange: browse.setQuery,
    onQuerySync: () => browse.syncExploreUrl({ q: browse.query }),
    onClearQuery: () => {
      browse.setQuery('');
      browse.syncExploreUrl({ q: '' });
    },
    onOpenItem: selection.openItem,
    searchScopeCounts,
    onSearchScopePick: handleExploreSearchCommit,
    searchFocusNonce,
    socialTab: browse.socialTab,
    onSocialTabChange: browse.applySocialTab,
    socialAllCount: socialPeoplePreview.preview?.allCount,
    socialFriendsCount: socialPeoplePreview.preview?.friendCount,
    socialFollowedCount: socialPeoplePreview.preview?.followedCount,
    socialPeople: socialPeople.people,
    socialLoading: socialPeople.loading,
    socialError: socialPeople.error,
    onRefreshSocialPeople: socialPeople.refresh,
    onOpenSocialActivity: openExploreActivityFromRef,
    discoveryOnTrips: memberDiscovery.onTrips,
    discoveryDirectory: memberDiscovery.directory,
    discoveryQuota: memberDiscovery.quota,
    discoveryLoading: memberDiscovery.loading,
    discoveryError: memberDiscovery.error,
    onOpenDiscoveryActivity: openDiscoveryActivityOnMap,
    followedSegment: browse.followedSegment,
    onFollowedSegmentChange: browse.applyFollowedSegment,
    entityFollows: entityFollows.follows,
    entityFollowsLoading: entityFollows.loading,
    entityFollowsError: entityFollows.error,
    isSignedIn: Boolean(user),
    userRole: user?.role,
    buddyUserIds: user ? new Set(socialPeoplePreview.preview?.friendUserIds ?? []) : undefined,
  };

  const desktopBrowsePanel = (
    <ListDiscoveryExperience surface="exploreSidebar" onCloseMapOverlay={browse.closeListPanel} />
  );

  const desktopSocialPanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={[]}
      onClose={browse.closeSocialPanel}
      closePanelAriaLabel="Close Social panel"
      closeButtonVariant="dismiss"
      listMode="social"
    />
  );

  const mobileListSocialPanel = (
    <ListFeedActionsProvider key="explore-list-social">
      <ExploreBrowsePanel
        {...browsePanelShared}
        listItems={[]}
        onClose={browse.closeListPanel}
        closePanelAriaLabel="Close Social"
        closeButtonVariant="dismiss"
        listMode="social"
        mobileSheetChrome
      />
    </ListFeedActionsProvider>
  );

  const mobileListDiscoverPanel = (
    <ListDiscoveryExperience
      key="explore-list-discover"
      surface="mapOverlay"
      onCloseMapOverlay={browse.closeListPanel}
    />
  );

  const primaryFabLabel = 'Add New';

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PageMeta
        title={
          myTripsMode
            ? 'My trips on the map'
            : 'Explore hiking, camping, events & shops'
        }
        description={
          myTripsMode
            ? 'See your upcoming outings on the UAE Trail map.'
            : 'Find live hiking, camping, events, and shops on the map across the UAE.'
        }
        path={EXPLORE_MAP_PATH}
      />

      <div className="relative flex min-h-0 flex-1 lg:flex-row">
        {browse.showListPanel && isDesktop && browse.listMode !== 'social' ? (
          <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-neutral-200 lg:bg-neutral-50 lg:px-4 lg:py-4 lg:transition-[width] lg:duration-300">
            {desktopBrowsePanel}
          </aside>
        ) : null}

        <ExploreMapStage
          isDesktop={isDesktop}
          listOpen={browse.listOpen}
          panel={browse.panel}
          mapFilter={browse.mapFilter}
          venueRegions={browse.venueRegions}
          activityDatePreset={browse.activityDatePreset}
          onBrowsePanelChange={(next) => browse.applyBrowsePanel(next)}
          onMapFilterChange={browse.applyMapFilter}
          onActivityDatePresetChange={browse.applyActivityDatePreset}
          onVenueRegionsChange={browse.applyVenueRegions}
          onOpenSocialPanel={openSocialPanel}
          socialPanelAvatars={socialPanelMapChip.avatars}
          socialPanelExtraCount={socialPanelMapChip.extraCount}
          socialPanelFriendCount={socialPanelMapChip.friendCount}
          searchQuery={browse.query}
          onSearchQueryChange={browse.setQuery}
          onOpenExploreSearch={() => setExploreSearchModalOpen(true)}
          searchScopeCounts={searchScopeCounts}
          exploreMapStyle={viewport.exploreMapStyle}
          exploreMapTiles={exploreMapTiles}
          onToggleMapStyle={viewport.toggleExploreMapStyle}
          mapPins={mapPins}
          selectedId={selectedId}
          highlightedExploreItemId={null}
          recenterTo={viewport.recenterTo}
          exploreMapCenter={viewport.exploreMapCenter}
          onPinClick={handleMapPinClick}
          loading={mapLoading}
          loadError={loadError}
          onReloadMap={reloadMap}
          venueNotice={selection.venueNotice}
          onDismissVenueNotice={() => selection.setVenueNotice(null)}
          demandNotice={selection.demandNotice}
          onDismissDemandNotice={() => selection.setDemandNotice(null)}
          user={user}
          locationPromptOpen={viewport.locationPromptOpen}
          locatingDevice={viewport.locatingDevice}
          onAllowMapLocation={viewport.handleAllowMapLocation}
          onDismissLocationPrompt={viewport.dismissLocationPromptUi}
          onOpenBrowse={browse.openBrowse}
          onPrimaryFab={compose.handleCreateTap}
          primaryFabLabel={primaryFabLabel}
          selected={selection.selected}
          selectedCard={selection.selectedCard}
          joinUiState={selection.peekJoinUiState}
          joinStateLoading={selection.peekJoinStateLoading}
          onCloseSelection={handleCloseMapSelection}
          joinInvitePeekBanner={joinInvitePeekBanner}
          onJoin={selection.handleJoin}
          onMessage={selection.handleDemandMessage}
          onActivityMapPeekAction={selection.handleActivityMapPeekAction}
          activityPeekSkipsJoinContext={selection.activityPeekSkipsJoinContext}
          linkRideshareTenantId={tenantId}
          onDemandRemove={
            selection.selectedCard?.showDemandOwnerActions ? selection.requestDemandRemove : undefined
          }
          onDemandFullManage={
            selection.selectedCard?.showDemandOwnerActions ? selection.handleDemandManage : undefined
          }
          onDemandLinkRideshare={
            selection.selectedCard?.showDemandLinkRideshare ? handleOfferRideshareForDemand : undefined
          }
          hostActivityCtaHandlers={hostActivityCtaHandlers}
          onOpenExploreItem={(exploreItemId) => {
            const item = selectionItems.find((entry) => entry.id === exploreItemId);
            if (item) selection.openItem(item);
          }}
          onWithdraw={() => selection.joinActions.setShowWithdraw(true)}
          onGuestGatedAction={selection.handleGuestGatedAction}
          onPlanTripFromVenue={handlePlanTripFromVenue}
        />

        {browse.showListPanel && !isDesktop ? (
          <ExploreMobileBrowseOverlay
            open
            onClose={browse.closeListPanel}
            sheetSize={browse.listMode === 'social' ? 'content' : 'full'}
          >
            {browse.listMode === 'social' ? mobileListSocialPanel : mobileListDiscoverPanel}
          </ExploreMobileBrowseOverlay>
        ) : null}

        {inviteShare.sheet}

        {isDesktop && browse.listMode === 'social' ? (
          <aside
            className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-l lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300"
          >
            {desktopSocialPanel}
          </aside>
        ) : null}
      </div>

      <ExploreComposeHost
        exploreCompose={compose.exploreCompose}
        composeMenuOpen={compose.composeMenuOpen}
        organizeWizardOpen={organizeWizardOpen}
        findWizardOpen={Boolean(compose.findRoute)}
        addWizardOpen={Boolean(compose.addRoute)}
        organizeKind={compose.organizeRoute?.kind ?? null}
        findKind={compose.findRoute?.kind}
        addKind={compose.addRoute?.kind ?? null}
        organizeWizardPrefill={organizeWizardPrefill}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={closeCreateFlow}
        onOrganizeBackToIntent={() => {
          organizeFrom.clearOrganizeFromPrefill();
          setOrganizeFromPlacePrefill(null);
          setRideshareLinkParent(null);
          setRideshareLinkDemand(null);
          compose.setComposeRoute({ surface: 'menu', intent: 'organize' });
        }}
        onFindBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'find' })}
        onAddBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'add' })}
        onActivityPublished={async (activity) => {
          await selection.handleActivityPublished(activity);
          if (rideshareLinkParent && activity.activityType === 'rideshare') {
            setRideshareLinkParent(null);
          }
          if (rideshareLinkDemand && activity.activityType === 'rideshare') {
            setRideshareLinkDemand(null);
          }
          void refreshHostGate();
        }}
        onDemandSubmitted={(result) => {
          selection.handleDemandSubmitted(result);
          void refreshHostGate();
        }}
        onCreateLinkedRideshare={handleCreateLinkedRideshare}
        planWithBuddyUserId={planWithBuddyUserId}
        onOpenHostApplication={() => {
          closeCreateFlow();
          const returnPath = `${pathname}${search}`;
          navigateOrganizePublishGate(returnPath);
        }}
        onContributeSubmitted={selection.handleContributeSubmitted}
      />

      <HostActivityCancelDialog
        activity={selection.hostRemoveConfirm}
        participantNotice={hostRemoveParticipantNotice}
        busy={selection.hostRemoveBusy}
        onClose={() => selection.setHostRemoveConfirm(null)}
        onConfirm={() => void selection.confirmHostRemove()}
      />

      <Dialog
        open={Boolean(selection.demandRemoveIntentId)}
        onClose={() => selection.setDemandRemoveIntentId(null)}
        title="Delete request?"
      >
        <p className="mb-4 text-sm text-neutral-600">
          This deletes your looking-for post from the map. Hosts who saved it will stop seeing it on Explore.
        </p>
        <div className="flex justify-end gap-2">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => selection.setDemandRemoveIntentId(null)}
          >
            Keep
          </AppButton>
          <AppButton
            type="button"
            variant="destructive"
            disabled={selection.demandRemoveBusy}
            onClick={() => void selection.confirmDemandRemove()}
          >
            Delete
          </AppButton>
        </div>
      </Dialog>

      <ExploreJoinOverlays activity={selection.selected?.activity} joinActions={selection.joinActions} />

      <ExploreBrowseSearchModal
        open={exploreSearchModalOpen}
        onClose={() => setExploreSearchModalOpen(false)}
        query={browse.query}
        onQueryChange={browse.setQuery}
        onCommit={handleExploreSearchCommit}
        scopeCounts={searchScopeCounts}
      />

      <ExploreResponsiveSheet
        open={compose.guestComposeSignInOpen}
        onClose={compose.closeGuestComposeSignIn}
        maxWidthClass="max-w-md"
        zClass={EXPLORE_Z.guestJoinSheet}
        overlayFixed
        layout="centered"
        showCloseButton
        showHandle={false}
        ariaLabel="Sign in to continue"
      >
        <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
          <ExploreGuestSignInCard intent="peek-details" compact />
          <button
            type="button"
            onClick={compose.closeGuestComposeSignIn}
            className="mt-2 block w-full py-2 text-center text-sm font-medium text-neutral-400"
          >
            Keep browsing
          </button>
        </div>
      </ExploreResponsiveSheet>
    </div>
  );
};
