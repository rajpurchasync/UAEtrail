import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useLocation, type NavigateFunction } from 'react-router-dom';
import {
  activityDetailPath,
  resolveActivityDisplayCoordinates,
  resolveActivityHostUserId,
  type ActivityDTO,
  type ExploreMapItemDTO,
  type UserRole,
} from '@uaetrail/shared-types';
import { useExplorePeekShareAction } from './useExplorePeekShareAction';
import { hostPublishedActivityPeekAccess } from '../../access/resolvePeekDetailAccess';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import { navigateToMessagesWithReturn } from '../../utils/activityGroupChatNav';
import { buildMapPeekReturnPath } from '../mapPeekDetailNavState';
import { readExploreMapItemsFromCache, reloadExploreMap } from '../../hooks/useExploreMap';
import { isExploreMapBboxEnabled } from '../exploreMapBbox';
import { memberAvailabilityQueryKey } from '../../hooks/clientQueryKeys';
import type { AddSubmitResult } from './addFlow';
import type { AvailabilityFixedSubmitResult } from './intentFixedFlowEngine';
import type { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import type { ActivityManageInitialView } from '../../components/activity/activityManageViews';
import { buildExploreSelectionSelectedCard } from '../exploreSelectionSelectedCard';
import { useExploreSelectionPeekJoin } from './useExploreSelectionPeekJoin';
import { useExploreActivityPinDeepLink } from './useExploreActivityPinDeepLink';
import { useExploreSelectionRemovals } from './useExploreSelectionRemovals';
import { hostPublishAvailabilityNoticeMessage } from '../../plan/hostPublishAvailabilityNotice';
import { recordGuestExplorePreviewView } from '../guestMapPreviewPolicy';
import { navigateToAuthGate, withAuthResumeShare } from '../../utils/authReturnContext';
import { useExploreSelectionMapPeekAction } from './useExploreSelectionMapPeekAction';

type BrowseState = ReturnType<typeof useExploreBrowseUrlState>;

type UseExploreSelectionActionsArgs = {
  items: ExploreMapItemDTO[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  user: { id: string; role?: string } | null | undefined;
  tenantId: string | null | undefined;
  navigate: NavigateFunction;
  queryClient: QueryClient;
  browse: BrowseState;
  isDesktop: boolean;
  closeCompose: () => void;
  handleFocusMapLocation: (coords: { lat: number; lng: number }) => void;
  setLinkOnlyPeekItems: Dispatch<SetStateAction<ExploreMapItemDTO[]>>;
  onInviteActivity?: (
    activity: ActivityDTO,
    options?: { canSendFriendInvites?: boolean }
  ) => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onOfferRideshareForAvailability?: () => void;
  onOpenHostManage?: (
    activity: ActivityDTO,
    initialView?: ActivityManageInitialView
  ) => void;
  onShareHostedActivity?: (activity: ActivityDTO) => void;
};

export const useExploreSelectionActions = ({
  items,
  selectedId,
  setSelectedId,
  user,
  tenantId,
  navigate,
  queryClient,
  browse,
  isDesktop,
  closeCompose,
  handleFocusMapLocation,
  setLinkOnlyPeekItems,
  onInviteActivity,
  onCreateLinkedRideshare,
  onOfferRideshareForAvailability,
  onOpenHostManage,
  onShareHostedActivity,
}: UseExploreSelectionActionsArgs) => {
  const location = useLocation();
  const { setListOpen, setMapFilter, setActivityFilter, syncExploreUrl } = browse;

  const peekReturnPath = useCallback(
    (mapItemId: string | null | undefined): string | undefined => {
      if (!mapItemId?.trim()) return undefined;
      return buildMapPeekReturnPath(mapItemId, location);
    },
    [location]
  );

  const [exploreNotice, setExploreNotice] = useState<string | null>(null);
  const [venueNotice, setVenueNotice] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedCard = useMemo(
    () => buildExploreSelectionSelectedCard(selected, items, user),
    [selected, items, user]
  );

  const peekJoin = useExploreSelectionPeekJoin({
    selected,
    selectedCard,
    user,
    setExploreNotice,
    setSelectedId,
    navigate,
    location,
    selectedId,
  });

  const removals = useExploreSelectionRemovals({
    tenantId,
    queryClient,
    setSelectedId,
    setVenueNotice,
    onOpenHostManage,
  });

  const handleGuestPreviewLimitGate = useCallback(() => {
    if (!user) peekJoin.joinActions.openGuestBrowseGate('preview-limit', 'view_detail');
  }, [user, peekJoin.joinActions]);

  const openItem = useCallback(
    (item: ExploreMapItemDTO) => {
      if (!user && !recordGuestExplorePreviewView(item.id).allowed) {
        handleGuestPreviewLimitGate();
        return;
      }
      closeCompose();
      setSelectedId(item.id);
      if (!isDesktop) {
        setListOpen(false);
      }
    },
    [closeCompose, handleGuestPreviewLimitGate, isDesktop, setListOpen, setSelectedId, user]
  );

  const { tryOpenActivityPinDeepLink } = useExploreActivityPinDeepLink({
    items,
    user,
    isDesktop,
    setListOpen,
    setLinkOnlyPeekItems,
    setSelectedId,
    setExploreNotice,
    handleFocusMapLocation,
    openItem,
  });

  const handleHostMessage = useCallback(async () => {
    const activity = selected?.activity;
    if (!activity) return;
    try {
      const returnTo = peekReturnPath(selectedId);
      setSelectedId(null);
      await openActivityGroupChat(navigate, activity.id, activity.groupChatId, { returnTo });
    } catch (err) {
      setExploreNotice(err instanceof Error ? err.message : 'Could not open activity chat.');
    }
  }, [selected, selectedId, navigate, setSelectedId, peekReturnPath]);

  const handleMessageActivityHost = useCallback(() => {
    const activity = selected?.activity;
    if (!activity) return;
    const hostUserId = resolveActivityHostUserId(activity);
    if (!hostUserId) return;
    if (!user) {
      peekJoin.joinActions.openGuestBrowseGate('peek-details', 'message_host');
      return;
    }
    const returnTo = peekReturnPath(selectedId);
    setSelectedId(null);
    navigateToMessagesWithReturn(
      navigate,
      messagesRouteForRole((user.role ?? 'participant') as UserRole, hostUserId, {
        activityId: activity.id,
      }),
      returnTo
    );
  }, [selected, selectedId, user, navigate, setSelectedId, peekJoin.joinActions, peekReturnPath]);

  const handleInviteCrew = useCallback(() => {
    const activity = selected?.activity;
    if (!activity || activity.status !== 'published') return;
    onInviteActivity?.(activity, { canSendFriendInvites: true });
  }, [onInviteActivity, selected?.activity]);

  const handleGuestShareActivity = useCallback(
    (activity: ActivityDTO) => {
      navigateToAuthGate(navigate, location, {
        returnPath: withAuthResumeShare(activityDetailPath(activity.id)),
      });
    },
    [location, navigate]
  );

  const handleSharePeek = useExplorePeekShareAction({
    selectedCard,
    activity: selected?.activity,
    user,
    onInviteActivity,
    onShareHostedActivity,
    onGuestShareActivity: handleGuestShareActivity,
  });

  const mapPeekAction = useExploreSelectionMapPeekAction({
    selected,
    location,
    navigate,
    setSelectedId,
    peekJoin,
    handleHostMessage,
    handleMessageActivityHost,
    handleInviteCrew,
    handleSharePeek,
    onCreateLinkedRideshare,
    onOfferRideshareForAvailability,
    onOpenHostManage,
  });

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (activity.joinMode === 'private') {
        if (isExploreMapBboxEnabled()) {
          await reloadExploreMap(queryClient);
        }
        const peekItem = buildExploreMapItemFromActivity(
          activity,
          hostPublishedActivityPeekAccess(activity.joinMode === 'private' ? 'private' : 'open')
        );
        setLinkOnlyPeekItems((prev) => {
          const rest = prev.filter((entry) => entry.id !== peekItem.id);
          return [...rest, peekItem];
        });
        const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
        if (latitude != null && longitude != null) {
          handleFocusMapLocation({ lat: latitude, lng: longitude });
        }
        setSelectedId(peekItem.id);
        setVenueNotice(
          'Private plan published — share the link with your group. It won’t appear on the public map.'
        );
        return;
      }

      setMapFilter('all');
      setActivityFilter('all');
      syncExploreUrl({ filter: 'all', activityFilter: 'all', panel: 'activities' });

      if (isExploreMapBboxEnabled()) {
        await reloadExploreMap(queryClient);
      }

      const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
      if (latitude != null && longitude != null) {
        handleFocusMapLocation({ lat: latitude, lng: longitude });
        setSelectedId(`activity:${activity.id}`);
      }

      const hostUserId = user?.id ?? resolveActivityHostUserId(activity);
      const notice = await hostPublishAvailabilityNoticeMessage(activity, hostUserId);
      if (notice) setVenueNotice(notice);
    },
    [
      queryClient,
      syncExploreUrl,
      setMapFilter,
      setActivityFilter,
      handleFocusMapLocation,
      setSelectedId,
      setLinkOnlyPeekItems,
      setVenueNotice,
      user?.id,
    ]
  );

  const handleCloseSelection = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  const handleAvailabilityFixedSubmitted = useCallback(
    async (result: AvailabilityFixedSubmitResult) => {
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: memberAvailabilityQueryKey(user.id) });
      }
      await reloadExploreMap(queryClient);
      if (!result.visibleOnMap) {
        return;
      }
      const mapItems = readExploreMapItemsFromCache(queryClient);
      const pin = mapItems?.find((item) => item.id === result.mapItemId);
      if (pin?.latitude != null && pin?.longitude != null) {
        handleFocusMapLocation({ lat: pin.latitude, lng: pin.longitude });
      }
      setSelectedId(result.mapItemId);
      if (!isDesktop) {
        setListOpen(false);
      }
    },
    [queryClient, setSelectedId, handleFocusMapLocation, isDesktop, setListOpen, user?.id]
  );

  const handleAddSubmitted = useCallback(
    (result: AddSubmitResult) => {
      void reloadExploreMap(queryClient);
      setVenueNotice(
        `"${result.location.name}" submitted for review. You'll see it on the map once it's published.`
      );
    },
    [queryClient]
  );

  return {
    selected,
    selectedCard,
    activityPeekSkipsJoinContext: peekJoin.activityPeekSkipsJoinContext,
    handleActivityMapPeekAction: mapPeekAction.handleActivityMapPeekAction,
    handleOfferTransport: mapPeekAction.handleOfferTransport,
    showAvailabilityPeekOfferRideshare: mapPeekAction.showAvailabilityPeekOfferRideshare,
    handleOfferRideshareForAvailability: onOfferRideshareForAvailability,
    joinUiState: peekJoin.joinUiState,
    joinStateLoading: peekJoin.joinStateLoading,
    peekJoinUiState: peekJoin.peekJoinUiState,
    peekJoinStateLoading: peekJoin.peekJoinStateLoading,
    joinActions: peekJoin.joinActions,
    handlePeekJoinSuccess: peekJoin.handlePeekJoinSuccess,
    exploreNotice,
    venueNotice,
    setExploreNotice,
    setVenueNotice,
    openItem,
    handleGuestGatedAction: peekJoin.handleGuestGatedAction,
    handleGuestPreviewLimitGate,
    handleJoin: peekJoin.handleJoin,
    handlePeekHostMessage: peekJoin.handlePeekHostMessage,
    handleHostMessage,
    handleInviteCrew,
    handleSharePeek,
    requestHostRemove: removals.requestHostRemove,
    hostRemoveConfirm: removals.hostRemoveConfirm,
    setHostRemoveConfirm: removals.setHostRemoveConfirm,
    confirmHostRemove: removals.confirmHostRemove,
    hostRemoveBusy: removals.hostRemoveBusy,
    handleActivityPublished,
    tryOpenActivityPinDeepLink,
    handleCloseSelection,
    handleAvailabilityFixedSubmitted,
    handleAddSubmitted,
  };
};
