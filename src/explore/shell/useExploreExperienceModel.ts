import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { describeExploreMapLoadError } from '../exploreMapErrors';
import { useAuth } from '../../context/AuthContext';
import { useHostStatus } from '../../hooks/useHostStatus';
import { useExploreMap, reloadExploreMap } from '../../hooks/useExploreMap';
import { useExploreMapFetchScope } from '../useExploreMapFetchScope';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { getExploreMapTiles } from '../../config/platform';
import { useExploreBrowseList } from '../ui/useExploreBrowseList';
import { useExploreBrowseUrlState } from '../ui/useExploreBrowseUrlState';
import { useExploreComposeRoute } from '../ui/useExploreComposeRoute';
import { useExploreFulfillIntent } from '../ui/useExploreFulfillIntent';
import { useExploreOrganizeFromActivity } from '../ui/useExploreOrganizeFromActivity';
import type { OrganizeWizardPrefill } from '../ui/organizeWizardPrefill';
import {
  organizePublishGateHref,
  organizePublishGateInputFromHostGate,
} from '../../utils/organizePublishGate';
import { buildRideshareDraftFromDemandMapItem, buildRideshareDraftFromParentActivity } from '../linkRidesharePrefill';
import {
  areaDetailPath,
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { hostActivityCancelParticipantNotice } from '../../host/hostActivityCancelParticipantNotice';
import { useExploreMapViewport } from '../ui/useExploreMapViewport';
import { useExploreSelectionActions } from '../ui/useExploreSelectionActions';
import {
  MY_TRIPS_QUERY_KEY,
  PLAN_WITH_QUERY_KEY,
  parseOrganizeFromActivityId,
  parsePlanWithUserId,
} from '../routing';
import { activityJoinInviteBanner } from '../../content/exploreGoingPanelCopy';
import { useMemberJourneyMapPinIds } from '../../hooks/useMemberJourneyMapPinIds';
import type { ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { useHostActivitySheetBundle } from '../../hooks/useHostActivitySheetBundle';
import { filterExploreMapItemsByAreaSlug, parseExploreAreaSlug } from '../exploreAreaFilter';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { useExplorePeopleBrowseBundle } from './useExplorePeopleBrowseBundle';
import { useExplorePinDeepLink } from './useExplorePinDeepLink';
import type { ExploreBrowsePanelProps } from '../ui/ExploreBrowsePanel';
import type { ComponentProps } from 'react';
import { PeopleBrowsePanel } from '../ui/PeopleBrowsePanel';

type PeopleProps = ComponentProps<typeof PeopleBrowsePanel>;

type BrowsePanelShared = Omit<
  ExploreBrowsePanelProps,
  'listItems' | 'mapPool' | 'onClose' | 'closePanelAriaLabel' | 'closeButtonVariant' | 'mobileSheetChrome'
>;

/** Explore map + browse + compose + selection orchestration (R2). */
export const useExploreExperienceModel = () => {
  const { user } = useAuth();
  const {
    status: hostStatus,
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
  const myTripsMode = searchParams.get(MY_TRIPS_QUERY_KEY) === '1';
  const { ids: myTripsPinIds, loading: myTripsPinsLoading } = useMemberJourneyMapPinIds(
    myTripsMode ? user?.id : undefined
  );
  const areaSlug = parseExploreAreaSlug(searchParams);
  const mapFetch = useExploreMapFetchScope(areaSlug);
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap({
    scope: mapFetch.scope,
  });
  const mapItems = useMemo(() => {
    const areaScoped = filterExploreMapItemsByAreaSlug(items, areaSlug);
    if (!myTripsMode) return areaScoped;
    if (!myTripsPinIds) return [];
    return areaScoped.filter((item) => myTripsPinIds.has(item.id));
  }, [items, myTripsMode, myTripsPinIds, areaSlug]);
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
    [compose]
  );

  const selected = selectionItems.find((item) => item.id === selectedId) ?? null;

  const handleOfferRideshareForDemand = useCallback(() => {
    if (!selected || !exploreMapItemIsSeeking(selected)) return;

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
    canPublish,
    navigate,
    navigateOrganizePublishGate,
    compose,
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
    return null;
  }, [rideshareLinkParent, rideshareLinkDemand, organizeFrom.organizeFromPrefill]);

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
    onInviteActivity: inviteShare.openInviteFromActivity,
    onCreateLinkedRideshare: handleCreateLinkedRideshare,
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
    return hostActivityCancelParticipantNotice(
      activity,
      selection.selectedCard?.participantPreviews
    );
  }, [selection.hostRemoveConfirm, selection.selectedCard?.participantPreviews]);

  const organizeFromPending = Boolean(parseOrganizeFromActivityId(searchParams));
  const organizeWizardOpen =
    Boolean(organizeWizardPrefill) ||
    (Boolean(compose.organizeRoute) && !organizeFromPending);

  useExplorePinDeepLink({
    loading,
    searchParams,
    setSearchParams,
    selectionItems,
    selection,
    navigate,
    pathname,
    search,
    composeOrganizeKind: compose.organizeRoute?.kind,
    rideshareLinkDemand,
    setRideshareLinkDemand,
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
  const publishedAreas = useExplorePublishedAreas();

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
      mapItems,
      areaSlug,
      isDesktop,
      onOpenExploreActivity: openExploreActivityFromRef,
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
      const stack = pin.stackExploreItemIds;
      const itemId =
        (stack?.find((id) => id === selectedId) ?? stack?.[0]) ?? pin.exploreItemId ?? pin.id;
      const item = selectionItems.find((entry) => entry.id === itemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selectedId, selection]
  );

  const closeCreateFlow = useCallback(() => {
    compose.closeCompose();
    organizeFrom.clearOrganizeFromPrefill();
    setRideshareLinkParent(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PLAN_WITH_QUERY_KEY);
        return next;
      },
      { replace: true }
    );
  }, [compose, organizeFrom, setSearchParams]);

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

  const browsePanelShared = useMemo((): BrowsePanelShared => {
    return {
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
      activityModeFilter: browse.activityModeFilter,
      onActivityModeFilterChange: browse.applyActivityModeFilter,
      publishedAreas,
      onPickArea: handlePickExploreArea,
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
      buddyUserIds: user ? new Set(memberPeoplePreview.preview?.friendUserIds ?? []) : undefined,
    };
  }, [
    isDesktop,
    mapLoading,
    myTripsMode,
    shopListSections,
    browse,
    publishedAreas,
    handlePickExploreArea,
    selection.openItem,
    searchScopeCounts,
    handleExploreSearchCommit,
    searchFocusNonce,
    user,
    memberPeoplePreview.preview?.friendUserIds,
  ]);

  const onOrganizeBackToIntent = useCallback(() => {
    organizeFrom.clearOrganizeFromPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkDemand(null);
    compose.setComposeRoute({ surface: 'menu', intent: 'organize' });
  }, [organizeFrom, compose]);

  const signInHref = useMemo(
    () => buildSignInRedirect({ pathname, search }).href,
    [pathname, search]
  );

  const onOpenHostApplication = useCallback(() => {
    closeCreateFlow();
    navigateOrganizePublishGate(`${pathname}${search}`);
  }, [closeCreateFlow, navigateOrganizePublishGate, pathname, search]);

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
    myTripsMode,
    areaSlug,
    mapItems,
    listItems,
    browse,
    browsePanelShared,
    peopleBrowsePanelProps: peopleBrowsePanelProps as PeopleProps,
    listFeedHostActions,
    compose,
    selection,
    selectionItems,
    selectedId,
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
    handleOfferRideshareForDemand,
    handleCreateLinkedRideshare,
    primaryFabLabel: 'Add New' as const,
    organizeWizardOpen,
    organizeWizardPrefill,
    planWithBuddyUserId,
    hostRemoveParticipantNotice,
    rideshareLinkParent,
    rideshareLinkDemand,
    setRideshareLinkParent,
    setRideshareLinkDemand,
    closeCreateFlow,
    onOrganizeBackToIntent,
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
