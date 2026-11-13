import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { useAuth } from '../../context/AuthContext';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { reloadExploreMap } from '../../hooks/useExploreMap';
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
import { areaDetailPath } from '@uaetrail/shared-types';
import { activityCancelParticipantNotice } from '../../activity/activityCancelParticipantNotice';
import { useExploreMapViewport } from '../ui/useExploreMapViewport';
import { useExploreSelectionActions } from '../ui/useExploreSelectionActions';
import { parseFacilityOnPlaceId, parsePlanWithUserId } from '../routing';
import { activityJoinInviteBanner } from '../../content/exploreGoingPanelCopy';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { guestExplorePreviewCanSearch } from '../guestMapPreviewPolicy';
import { useHostActivitySheetBundle } from '../../hooks/useHostActivitySheetBundle';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { useExplorePeopleBrowseBundle } from './useExplorePeopleBrowseBundle';
import { useExplorePinDeepLink } from './useExplorePinDeepLink';
import { useExploreMapCatalog } from './useExploreMapCatalog';
import { resolveExploreItemIdFromMapPin } from '../ui/exploreMapPinModel';
import { resolveBrowseListCreateFabLabel } from '../../list/browseListCopy';
import {
  resolveCreateFabComposeEntry,
  resolveExploreMapCreateFabHints,
} from '../create/composeFabEntry';

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
  const { pathname, search, state: locationState } = useLocation();
  const facilityOnPlaceId = parseFacilityOnPlaceId(searchParams);
  const isDesktop = useMinWidthLg();
  /** Side nav + in-map right rail for guest gates (md+), not browse panel layout (lg+). */
  const useDesktopGuestGatePanel = useMinWidthMd() && !user;

  const { myPlanMapMode, areaSlug, mapItems, mapLoading, loadError, mapFetch } =
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

  const hostSheets = useHostActivitySheetBundle({ tenantId });
  const { inviteShare, shareHostedActivity, openHostManage } = hostSheets;

  const createFabHints = useMemo(
    () =>
      resolveExploreMapCreateFabHints({
        panel: browse.panel,
        peopleBrowseOpen: browse.peopleBrowseOpen,
        listMode: browse.listMode,
        pinKind: browse.pinKind,
        placesMode: browse.placesMode,
      }),
    [
      browse.panel,
      browse.peopleBrowseOpen,
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
    compose.handleCreateTap(resolveCreateFabComposeEntry(pathname, fabSearch, createFabHints));
  }, [clearSelection, compose, pathname, fabSearch, createFabHints]);

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
  const [exploreSearchModalOpen, setExploreSearchModalOpen] = useState(
    () => searchParams.get('search') === '1'
  );

  useEffect(() => {
    if (searchParams.get('search') === '1') setExploreSearchModalOpen(true);
  }, [searchParams]);

  const closeExploreSearchModal = useCallback(() => {
    setExploreSearchModalOpen(false);
    if (searchParams.get('search') !== '1') return;
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
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

  const { mapPins, searchScopeCounts } = useExploreBrowseList({
    items: mapItems,
    ephemeralMapItems: linkOnlyPeekItems,
    mapFilter: browse.mapFilter,
    venueFilter: browse.venueFilter,
    tripMapTopics: browse.tripMapTopics,
    placeMapTopics: browse.placeMapTopics,
    venueRegions: browse.venueRegions,
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
    buddySubtype: browse.buddySubtype,
    outingTopic: browse.outingTopic,
    activityModeFilter: browse.activityModeFilter,
  });

  const { peopleBrowsePanelProps, openPeopleBrowsePanel, peopleBrowseMapChip } =
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
      closeExploreSearchModal();
      navigate(areaDetailPath(slug));
    },
    [closeExploreSearchModal, navigate]
  );

  const handleExploreSearchCommit = useCallback(
    (scope?: ExploreSearchScopeKey | null) => {
      if (!user && !guestExplorePreviewCanSearch()) {
        selection.handleGuestPreviewLimitGate();
        closeExploreSearchModal();
        return;
      }
      browse.commitExploreSearch(scope);
      setSearchFocusNonce((n) => n + 1);
    },
    [browse, closeExploreSearchModal, selection, user]
  );

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

  useEffect(() => {
    registerBridge({
      hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
      hostWizardOpen: hostingLauncher.hostWizardOpen,
      onCloseCreateFlow: hostingLauncher.closeCreateFlow,
      onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
      onActivityPublished: async (activity) => {
        await selection.handleActivityPublished(activity);
        if (hostingLauncher.rideshareLinkParent && activity.activityType === 'rideshare') {
          hostingLauncher.setRideshareLinkParent(null);
        }
        if (hostingLauncher.rideshareLinkSeeking && activity.activityType === 'rideshare') {
          hostingLauncher.setRideshareLinkSeeking(null);
        }
        void refreshHostGate();
      },
      onCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
      onSeekingSubmitted: (result) => {
        selection.handleSeekingSubmitted(result);
        void refreshHostGate();
      },
      onAddSubmitted: selection.handleAddSubmitted,
      planWithBuddyUserId,
      composeAreaSlug: areaSlug,
      facilityOnPlaceId,
      tenantId,
    });
    return () => registerBridge(null);
  }, [
    registerBridge,
    hostingLauncher,
    selection,
    planWithBuddyUserId,
    areaSlug,
    facilityOnPlaceId,
    tenantId,
    refreshHostGate,
  ]);

  return {
    user,
    tenantId,
    pathname,
    search,
    isDesktop,
    useDesktopGuestGatePanel,
    myPlanMapMode,
    areaSlug,
    mapItems,
    browse,
    peopleBrowsePanelProps,
    openPeopleBrowsePanel,
    peopleBrowseMapChip,
    compose,
    selection,
    selectionItems,
    selectedId,
    highlightedExploreItemId,
    setHighlightedExploreItemId,
    viewport,
    mapPins,
    exploreMapTiles,
    mapLoading,
    loadError,
    reloadMap,
    handleMapPinClick,
    joinInvitePeekBanner,
    handleCloseMapSelection,
    handleOfferRideshareForSeeking: hostingLauncher.handleOfferRideshareForSeeking,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    primaryFabLabel,
    handlePrimaryFabTap,
    hostWizardOpen: hostingLauncher.hostWizardOpen,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    planWithBuddyUserId,
    facilityOnPlaceId,
    hostRemoveParticipantNotice,
    rideshareLinkParent: hostingLauncher.rideshareLinkParent,
    rideshareLinkSeeking: hostingLauncher.rideshareLinkSeeking,
    setRideshareLinkParent: hostingLauncher.setRideshareLinkParent,
    setRideshareLinkSeeking: hostingLauncher.setRideshareLinkSeeking,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    refreshHostGate,
    exploreSearchModalOpen,
    setExploreSearchModalOpen,
    closeExploreSearchModal,
    handleExploreSearchCommit,
    searchScopeCounts,
    publishedAreas,
    handlePickExploreArea,
    signInHref,
    onOpenHostApplication,
    handleOpenExploreItem,
    onVisibleMapBoundsChange: mapFetch.onVisibleBoundsChange,
  };
};
