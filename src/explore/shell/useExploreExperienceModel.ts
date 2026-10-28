import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { useAuth } from '../../context/AuthContext';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { getExploreMapTiles } from '../../config/platform';
import { useExploreBrowseList } from '../ui/useExploreBrowseList';
import { useExploreBrowseUrlState } from '../ui/useExploreBrowseUrlState';
import { useComposeRoute } from '../create/hooks/useComposeRoute';
import { useHostingFromActivity } from '../create/hooks/useHostingFromActivity';
import { useHostingWizardPrefill } from '../create/hooks/useHostingWizardPrefill';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../utils/memberPublishGate';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { areaDetailPath } from '@uaetrail/shared-types';
import { activityCancelParticipantNotice } from '../../activity/activityCancelParticipantNotice';
import { useExploreMapViewport } from '../ui/useExploreMapViewport';
import { useExploreSelectionActions } from '../ui/useExploreSelectionActions';
import { parsePlanWithUserId } from '../routing';
import { activityJoinInviteBanner } from '../../content/exploreGoingPanelCopy';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { useHostActivitySheetBundle } from '../../hooks/useHostActivitySheetBundle';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { useExplorePeopleBrowseBundle } from './useExplorePeopleBrowseBundle';
import { useExplorePinDeepLink } from './useExplorePinDeepLink';
import { useExploreMapCatalog } from './useExploreMapCatalog';
import { resolveExploreItemIdFromMapPin } from '../ui/exploreMapPinModel';
import { useExploreBrowsePanelShared } from './useExploreBrowsePanelShared';

/** Explore map + browse + compose + selection orchestration (R2). */
export const useExploreExperienceModel = () => {
  const { user } = useAuth();
  const {
    status: hostStatus,
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    loading: hostGateLoading,
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
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, profileComplete, canPublish, isCommunityHost, hostTiers]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pathname, search, state: locationState } = useLocation();
  const isDesktop = useMinWidthLg();

  const { myPlanMapMode, areaSlug, mapItems, mapLoading, loadError, mapFetch } =
    useExploreMapCatalog({ userId: user?.id, searchParams });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedExploreItemId, setHighlightedExploreItemId] = useState<string | null>(null);
  const [linkOnlyPeekItems, setLinkOnlyPeekItems] = useState<ExploreMapItemDTO[]>([]);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const browse = useExploreBrowseUrlState({
    isDesktop,
    searchParams,
    setSearchParams,
    clearSelection,
  });

  useEffect(() => {
    if (!browse.listOpen) setHighlightedExploreItemId(null);
  }, [browse.listOpen]);

  const handleListItemHover = useCallback(
    (itemId: string) => {
      if (!isDesktop) return;
      setHighlightedExploreItemId(itemId);
    },
    [isDesktop]
  );

  const handleListItemHoverEnd = useCallback(() => {
    if (!isDesktop) return;
    setHighlightedExploreItemId(null);
  }, [isDesktop]);

  const viewport = useExploreMapViewport({
    user,
    locationState,
    pathname,
    search,
    navigate,
  });

  const compose = useComposeRoute({
    user,
    navigate,
    pathname,
    search,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: clearSelection,
    canPublish,
    profileComplete,
    hostGateLoading,
  });

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
    hostGateLoading,
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    navigate,
    pathname,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    hostComposeKind: compose.hostComposeRoute?.kind ?? null,
  });

  const selected = selectionItems.find((item) => item.id === selectedId) ?? null;

  const hostingLauncher = useHostingWizardPrefill({
    pathname,
    search,
    searchParams,
    setSearchParams,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    navigateMemberPublishGate,
    compose,
    hostingFrom,
    selected,
    setSelectedId,
  });

  const hostSheets = useHostActivitySheetBundle({
    tenantId,
    onMapDataChanged: () => reloadExploreMap(queryClient),
  });
  const { inviteShare, shareHostedActivity, openHostManage, listFeedHostActions, hostManageSheet } =
    hostSheets;

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
    onInviteActivity: inviteShare.openShareFromActivity,
    onCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
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

  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [exploreSearchModalOpen, setExploreSearchModalOpen] = useState(false);
  const publishedAreas = useExplorePublishedAreas(
    browse.listOpen || browse.browseOpen || exploreSearchModalOpen || Boolean(areaSlug)
  );

  const openExploreActivityFromRef = useCallback(
    (activity: { exploreItemId: string }) => {
      const item = mapItems.find((entry) => entry.id === activity.exploreItemId);
      if (item) selection.openItem(item);
    },
    [mapItems, selection]
  );

  const { mapPins, listItems, shopListSections, searchScopeCounts } = useExploreBrowseList({
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
    activityModeFilter: browse.activityModeFilter,
  });

  const { peopleBrowsePanelProps, openPeopleBrowsePanel, peopleBrowseMapChip, memberPeoplePreview } =
    useExplorePeopleBrowseBundle({
      user,
      hostStatus,
      browse,
      exploreCatalogItems: mapItems,
      areaSlug,
      isDesktop,
      mapLoading,
      onOpenExploreActivity: openExploreActivityFromRef,
      onOpenSeekingActivity: selection.openItem,
      searchFocusNonce,
    });

  const exploreMapTiles = useMemo(
    () => getExploreMapTiles(viewport.exploreMapStyle),
    [viewport.exploreMapStyle]
  );

  const reloadMap = useCallback(() => {
    void reloadExploreMap(queryClient);
  }, [queryClient]);

  const handleMapPinClick = useCallback(
    (pin: PlaceMapPin) => {
      const itemId = resolveExploreItemIdFromMapPin(pin);
      const item = selectionItems.find((entry) => entry.id === itemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selection]
  );

  const handlePickExploreArea = useCallback(
    (slug: string) => {
      setExploreSearchModalOpen(false);
      navigate(areaDetailPath(slug));
    },
    [navigate]
  );

  const handleExploreSearchCommit = useCallback(
    (scope?: ExploreSearchScopeKey | null) => {
      browse.commitExploreSearch(scope);
      setSearchFocusNonce((n) => n + 1);
    },
    [browse]
  );

  const browsePanelShared = useExploreBrowsePanelShared({
    isDesktop,
    mapLoading,
    myPlanMapMode,
    shopListSections,
    browse,
    publishedAreas,
    onPickArea: handlePickExploreArea,
    onOpenItem: selection.openItem,
    searchScopeCounts,
    onSearchScopePick: handleExploreSearchCommit,
    searchFocusNonce,
    buddyUserIds: user ? new Set(memberPeoplePreview.preview?.friendUserIds ?? []) : undefined,
    onListItemHover: handleListItemHover,
    onListItemHoverEnd: handleListItemHoverEnd,
  });

  const signInHref = useMemo(
    () => buildSignInRedirect({ pathname, search }).href,
    [pathname, search]
  );

  const closeCreateFlow = hostingLauncher.closeCreateFlow;

  const onOpenHostApplication = useCallback(() => {
    closeCreateFlow();
    navigateMemberPublishGate(`${pathname}${search}`);
  }, [closeCreateFlow, navigateMemberPublishGate, pathname, search]);

  const handleOpenExploreItem = useCallback(
    (exploreItemId: string) => {
      const item = selectionItems.find((entry) => entry.id === exploreItemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selection]
  );

  return {
    user,
    tenantId,
    pathname,
    search,
    isDesktop,
    myPlanMapMode,
    areaSlug,
    mapItems,
    listItems,
    browse,
    browsePanelShared,
    peopleBrowsePanelProps,
    listFeedHostActions,
    compose,
    selection,
    selectionItems,
    selectedId,
    highlightedExploreItemId,
    viewport,
    mapPins,
    exploreMapTiles,
    mapLoading,
    loadError,
    reloadMap,
    handleMapPinClick,
    openPeopleBrowsePanel,
    peopleBrowseMapChip,
    joinInvitePeekBanner,
    handleCloseMapSelection,
    handleOfferRideshareForSeeking: hostingLauncher.handleOfferRideshareForSeeking,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    primaryFabLabel: 'Add New' as const,
    hostWizardOpen: hostingLauncher.hostWizardOpen,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    planWithBuddyUserId,
    hostRemoveParticipantNotice,
    rideshareLinkParent: hostingLauncher.rideshareLinkParent,
    rideshareLinkSeeking: hostingLauncher.rideshareLinkSeeking,
    setRideshareLinkParent: hostingLauncher.setRideshareLinkParent,
    setRideshareLinkSeeking: hostingLauncher.setRideshareLinkSeeking,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    refreshHostGate,
    exploreSearchModalOpen,
    setExploreSearchModalOpen,
    handleExploreSearchCommit,
    searchScopeCounts,
    publishedAreas,
    handlePickExploreArea,
    inviteShareSheet: inviteShare.sheet,
    hostManageSheet,
    signInHref,
    onOpenHostApplication,
    handleOpenExploreItem,
    onVisibleMapBoundsChange: mapFetch.onVisibleBoundsChange,
  };
};
