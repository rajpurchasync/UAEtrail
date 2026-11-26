import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductLocation, useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useExploreCreateFlowBridge } from './useExploreCreateFlowBridge';
import { useExploreSearchParamRedirect } from './useExploreSearchParamRedirect';
import { exploreSearchHomePath } from '../search/exploreSearchRouting';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { getExploreMapTiles } from '../../config/platform';
import { useExploreBrowseList } from '../ui/useExploreBrowseList';
import { useExploreBrowseUrlState } from '../ui/useExploreBrowseUrlState';
import { useCreateFlow } from '../../create/CreateFlowProvider';
import { useHostingFromActivity } from '../create/hooks/useHostingFromActivity';
import { useHostingWizardPrefill } from '../create/hooks/useHostingWizardPrefill';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../utils/memberPublishGate';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { activityCancelParticipantNotice } from '../../activity/activityCancelParticipantNotice';
import { useExploreMapViewport } from '../ui/useExploreMapViewport';
import { useExploreSelectionActions } from '../ui/useExploreSelectionActions';
import { parseFacilityOnPlaceId, parsePlanWithUserId } from '../routing';
import { activityJoinInviteBanner } from '../../content/exploreGoingPanelCopy';
import { guestExplorePreviewCanSearch } from '../../discovery/discoveryPortExploreGuestWire';
import { useHostActivitySheetBundle } from '../../hooks/useHostActivitySheetBundle';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import { useCrewDiscoveryBrowseBundle } from '@/crew-discovery/hooks/useCrewDiscoveryBrowseBundle';
import { useExplorePinDeepLink } from './useExplorePinDeepLink';
import { useExploreMapCatalog } from './useExploreMapCatalog';
import { useExploreMapInteractionHandlers } from './useExploreMapInteractionHandlers';
import { resolveBrowseListCreateFabLabel } from '../../discovery/discoverySession';
import {
  resolveCreateEntryPreset,
  resolveExploreMapCreateFabHints,
} from '../create/composeFabEntry';
import { intentOpenCompose } from '../compose';
import { useBrowseGeoScopeHydration } from '../../discovery/discoverySession';
import { reloadExploreMap } from '../../hooks/useExploreMap';

/** Explore map + browse + compose + selection orchestration (R2). */
export const useExploreExperienceModel = () => {
  const { user } = useAuth();
  const {
    status: hostStatus,
    canPublish,
    profileComplete,
    guideProfileComplete,
    isCommunityHost,
    hostTiers,
    tenantId,
    refresh: refreshHostGate,
  } = useMemberStatus({
    enabled: Boolean(user),
  });
  const navigate = useNavigate();
  const navigateMemberPublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: user?.id ?? null,
            profileComplete,
            guideProfileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, profileComplete, guideProfileComplete, canPublish, isCommunityHost, hostTiers]
  );
  const [searchParams, setSearchParams] = useProductSearchParams();
  const queryClient = useQueryClient();
  const wasGuestRef = useRef(!user);
  useEffect(() => {
    if (user && wasGuestRef.current) {
      wasGuestRef.current = false;
      void reloadExploreMap(queryClient);
    }
    if (!user) {
      wasGuestRef.current = true;
    }
  }, [user, queryClient]);
  const { pathname, search, state: locationState } = useProductLocation();
  const facilityOnPlaceId = parseFacilityOnPlaceId(searchParams);
  const isDesktop = useMinWidthLg();
  /** Side nav + in-map right rail for guest gates (md+), not browse panel layout (lg+). */
  const useDesktopGuestGatePanel = useMinWidthMd() && !user;

  const { myPlanMapMode, destinationSlug, mapItems, mapLoading, loadError, mapFetch } =
    useExploreMapCatalog({ userId: user?.id, searchParams });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedExploreItemId, setHighlightedExploreItemId] = useState<string | null>(null);
  const [linkOnlyPeekItems, setLinkOnlyPeekItems] = useState<ExploreMapItemDTO[]>([]);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const browse = useExploreBrowseUrlState({
    isDesktop,
    isSignedIn: Boolean(user),
    searchParams,
    setSearchParams,
    clearSelection,
  });
  useBrowseGeoScopeHydration(browse.geoPath);

  useEffect(() => {
    if (!browse.listOpen) setHighlightedExploreItemId(null);
  }, [browse.listOpen]);

  const viewport = useExploreMapViewport({
    user,
    locationState,
    pathname,
    search,
    navigate,
  });

  const { compose, registerBridge } = useCreateFlow();

  const selectionItems = useMemo(() => {
    const ids = new Set(mapItems.map((entry) => entry.id));
    const extra = linkOnlyPeekItems.filter((entry) => !ids.has(entry.id));
    return extra.length > 0 ? [...mapItems, ...extra] : mapItems;
  }, [mapItems, linkOnlyPeekItems]);

  useEffect(() => {
    if (!myPlanMapMode || user) return;
    const { href } = buildSignInRedirect({ pathname, search });
    navigate(href, { replace: true });
  }, [myPlanMapMode, user, navigate, pathname, search]);

  const hostingFrom = useHostingFromActivity({
    user,
    tenantId,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    hostComposeKind: compose.activityComposeRoute?.kind ?? null,
  });

  const selected = selectionItems.find((item) => item.id === selectedId) ?? null;

  const hostingLauncher = useHostingWizardPrefill({
    pathname,
    search,
    searchParams,
    setSearchParams,
    user,
    navigate,
    compose,
    hostingFrom,
    selected,
    setSelectedId,
  });

  const hostSheets = useHostActivitySheetBundle({ tenantId });
  const { inviteShare, shareHostedActivity, openHostManage } = hostSheets;

  const createFabHints = useMemo(
    () =>
      resolveExploreMapCreateFabHints({
        panel: browse.panel,
        crewsBrowseOpen: browse.crewsBrowseOpen,
        listMode: browse.listMode,
        pinKind: browse.pinKind,
        placesMode: browse.placesMode,
      }),
    [
      browse.panel,
      browse.crewsBrowseOpen,
      browse.listMode,
      browse.pinKind,
      browse.placesMode,
    ]
  );

  const fabSearch = useMemo(
    () => (searchParams.toString() ? `?${searchParams.toString()}` : search),
    [searchParams, search]
  );

  const primaryFabLabel = useMemo(
    () => resolveBrowseListCreateFabLabel(pathname, fabSearch, createFabHints),
    [pathname, fabSearch, createFabHints]
  );

  const handlePrimaryFabTap = useCallback(() => {
    clearSelection();
    compose.handleCreateTap(resolveCreateEntryPreset(pathname, fabSearch, createFabHints));
  }, [clearSelection, compose, pathname, fabSearch, createFabHints]);

  const handleOpenMarkAvailability = useCallback(() => {
    compose.handleCreateTap(intentOpenCompose());
  }, [compose]);

  const planWithFriendUserId = parsePlanWithUserId(searchParams);
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
    onInviteActivity: inviteShare.openShareFromActivity,
    onCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    onOfferRideshareForAvailability: hostingLauncher.handleOfferRideshareForAvailability,
    onOpenHostManage: tenantId ? openHostManage : undefined,
    onShareHostedActivity: shareHostedActivity,
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

  const hostRemoveParticipantNotice = useMemo(() => {
    const activity = selection.hostRemoveConfirm;
    if (!activity) return null;
    return activityCancelParticipantNotice(
      activity,
      selection.selectedCard?.participantPreviews
    );
  }, [selection.hostRemoveConfirm, selection.selectedCard?.participantPreviews]);

  useExplorePinDeepLink({
    loading: mapLoading,
    searchParams,
    setSearchParams,
    selectionItems,
    selection,
    navigate,
    pathname,
    search,
    setJoinInvitePeekActivityId,
  });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const [searchFocusNonce] = useState(0);
  useExploreSearchParamRedirect(searchParams, pathname, navigate, setSearchParams);
  const publishedDestinations = useExplorePublishedDestinations(
    browse.listOpen || browse.browseOpen || Boolean(destinationSlug)
  );

  const openExploreSearch = useCallback(() => {
    if (!user && !guestExplorePreviewCanSearch()) {
      selection.handleGuestPreviewLimitGate();
      return;
    }
    navigate(exploreSearchHomePath());
  }, [navigate, selection, user]);

  const openExploreActivityFromRef = useCallback(
    (activity: { exploreItemId: string }) => {
      const item = mapItems.find((entry) => entry.id === activity.exploreItemId);
      if (item) selection.openItem(item);
    },
    [mapItems, selection]
  );

  const { mapPins, listItems, searchScopeCounts } = useExploreBrowseList({
    items: mapItems,
    ephemeralMapItems: linkOnlyPeekItems,
    mapFilter: browse.mapFilter,
    venueFilter: browse.venueFilter,
    tripMapTopics: browse.tripMapTopics,
    placeMapTopics: browse.placeMapTopics,
    venueRegions: browse.venueRegions,
    geoPath: browse.geoPath,
    priceFilter: browse.priceFilter,
    hasTrip: browse.hasTrip,
    facilityKinds: browse.facilityKinds,
    query: browse.query,
    activityDatePreset: browse.activityDatePreset,
    listMode: browse.listMode,
    searchScope: browse.searchScope,
    sidebarPanel: browse.sidebarPanel,
    isDesktop,
    desktopBrowseTab: browse.desktopBrowseTab,
    othersSubtype: browse.othersSubtype,
    outingTopic: browse.outingTopic,
    activityModeFilter: browse.activityModeFilter,
  });

  const { crewsBrowsePanelProps, openCrewsBrowsePanel, crewsBrowseMapChip } =
    useCrewDiscoveryBrowseBundle({
      user,
      hostStatus,
      browse,
      exploreCatalogItems: mapItems,
      destinationSlug,
      isDesktop,
      mapLoading,
      onOpenExploreActivity: openExploreActivityFromRef,
      onOpenAvailabilityCatalogItem: selection.openItem,
      onOfferRideshareForAvailabilityItem: hostingLauncher.offerRideshareForAvailabilityItem,
      onOpenIntentOpen: handleOpenMarkAvailability,
      searchFocusNonce,
    });

  const exploreMapTiles = useMemo(
    () => getExploreMapTiles(viewport.exploreMapStyle),
    [viewport.exploreMapStyle]
  );

  const { reloadMap, handleMapPinClick, handlePickExploreDestination } = useExploreMapInteractionHandlers(
    queryClient,
    selectionItems,
    selection,
    navigate
  );

  const signInHref = useMemo(
    () => buildSignInRedirect({ pathname, search }).href,
    [pathname, search]
  );

  const onOpenHostApplication = useCallback(() => {
    hostingLauncher.closeCreateFlow();
    navigateMemberPublishGate(`${pathname}${search}`);
  }, [hostingLauncher, navigateMemberPublishGate, pathname, search]);

  const handleOpenExploreItem = useCallback(
    (exploreItemId: string) => {
      const item = selectionItems.find((entry) => entry.id === exploreItemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selection]
  );

  useExploreCreateFlowBridge({
    registerBridge,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    rideshareLinkAvailability: hostingLauncher.rideshareLinkAvailability,
    setRideshareLinkAvailability: hostingLauncher.setRideshareLinkAvailability,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    handleActivityPublished: selection.handleActivityPublished,
    handleAvailabilityFixedSubmitted: selection.handleAvailabilityFixedSubmitted,
    handleAddSubmitted: selection.handleAddSubmitted,
    planWithFriendUserId,
    composeDestinationSlug: destinationSlug,
    facilityOnPlaceId,
    tenantId,
    refreshHostGate,
  });

  return {
    user,
    tenantId,
    pathname,
    search,
    isDesktop,
    useDesktopGuestGatePanel,
    myPlanMapMode,
    destinationSlug,
    mapItems,
    browse,
    crewsBrowsePanelProps,
    openCrewsBrowsePanel,
    crewsBrowseMapChip,
    compose,
    selection,
    selectionItems,
    selectedId,
    highlightedExploreItemId,
    setHighlightedExploreItemId,
    viewport,
    mapPins,
    catalogListCount: listItems.length,
    exploreMapTiles,
    mapLoading,
    loadError,
    reloadMap,
    handleMapPinClick,
    joinInvitePeekBanner,
    handleCloseMapSelection,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    primaryFabLabel,
    handlePrimaryFabTap,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    planWithFriendUserId,
    facilityOnPlaceId,
    hostRemoveParticipantNotice,
    rideshareLinkAvailability: hostingLauncher.rideshareLinkAvailability,
    setRideshareLinkAvailability: hostingLauncher.setRideshareLinkAvailability,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    refreshHostGate,
    openExploreSearch,
    searchScopeCounts,
    publishedDestinations,
    handlePickExploreDestination,
    signInHref,
    onOpenHostApplication,
    handleOpenExploreItem,
    onVisibleMapBoundsChange: mapFetch.onVisibleBoundsChange,
  };
};
