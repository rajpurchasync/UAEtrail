import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import {
  type ActivityDTO,
  type ActivityMapPeekActionId,
  type ExploreMapItemDTO,
  type UserRole,
} from '@uaetrail/shared-types';
import {
  activityDetailPath,
  resolveActivityDisplayCoordinates,
  resolveActivityHostUserId,
} from '@uaetrail/shared-types';
import { buildShareText, buildShareUrl } from '../../utils/share';
import { hostPublishedActivityPeekAccess } from '../../access/resolvePeekDetailAccess';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import { executeActivityMapPeekAction } from '../../activity/executeActivityMapPeekAction';
import { readExploreMapItemsFromCache, reloadExploreMap } from '../../hooks/useExploreMap';
import { isExploreMapBboxEnabled } from '../exploreMapBbox';
import { invalidateMySeekingPostsQueries } from '../../hooks/seekingClientApi';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';
import type { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import type { ActivityManageInitialView } from '../../components/activity/activityManageViews';
import { buildExploreSelectionSelectedCard } from '../exploreSelectionSelectedCard';
import { useExploreSelectionPeekJoin } from './useExploreSelectionPeekJoin';
import { useExploreActivityPinDeepLink } from './useExploreActivityPinDeepLink';
import { useExploreSelectionRemovals } from './useExploreSelectionRemovals';
import { hostPublishAvailabilityNoticeMessage } from '../../plan/hostPublishAvailabilityNotice';

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
    options?: { canSendBuddyInvites?: boolean }
  ) => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
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
  onOpenHostManage,
  onShareHostedActivity,
}: UseExploreSelectionActionsArgs) => {
  const { setListOpen, setMapFilter, setActivityFilter, syncExploreUrl } = browse;

  const [demandNotice, setDemandNotice] = useState<string | null>(null);
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
    setDemandNotice,
    setSelectedId,
    navigate,
  });

  const removals = useExploreSelectionRemovals({
    tenantId,
    queryClient,
    setSelectedId,
    setVenueNotice,
    onOpenHostManage,
  });

  const openItem = useCallback(
    (item: ExploreMapItemDTO) => {
      closeCompose();
      setSelectedId(item.id);
      if (!isDesktop) {
        setListOpen(false);
      }
    },
    [closeCompose, isDesktop, setListOpen, setSelectedId]
  );

  const { tryOpenActivityPinDeepLink } = useExploreActivityPinDeepLink({
    items,
    user,
    isDesktop,
    setListOpen,
    setLinkOnlyPeekItems,
    setSelectedId,
    setDemandNotice,
    handleFocusMapLocation,
    openItem,
  });

  const handleHostMessage = useCallback(async () => {
    const activity = selected?.activity;
    if (!activity) return;
    try {
      setSelectedId(null);
      await openActivityGroupChat(navigate, activity.id, activity.groupChatId);
    } catch (err) {
      setDemandNotice(err instanceof Error ? err.message : 'Could not open activity chat.');
    }
  }, [selected, navigate, setSelectedId]);

  const handleMessageActivityHost = useCallback(() => {
    const activity = selected?.activity;
    if (!activity) return;
    const hostUserId = resolveActivityHostUserId(activity);
    if (!hostUserId) return;
    if (!user) {
      peekJoin.joinActions.openGuestSheet('activity');
      return;
    }
    setSelectedId(null);
    navigate(
      messagesRouteForRole((user.role ?? 'participant') as UserRole, hostUserId, {
        activityId: activity.id,
      })
    );
  }, [selected, user, navigate, setSelectedId, peekJoin.joinActions]);

  const handleInviteCrew = useCallback(() => {
    const activity = selected?.activity;
    if (!activity || activity.status !== 'published') return;
    onInviteActivity?.(activity, { canSendBuddyInvites: true });
  }, [onInviteActivity, selected?.activity]);

  const handleActivityMapPeekAction = useCallback(
    (actionId: ActivityMapPeekActionId) => {
      const activity = selected?.activity;
      executeActivityMapPeekAction(actionId, {
        openCrewChat: () => void handleHostMessage(),
        messageHost: handleMessageActivityHost,
        inviteCrew: handleInviteCrew,
        linkRideshare: () => {
          if (activity && onCreateLinkedRideshare) onCreateLinkedRideshare(activity);
        },
        offerRideshare: () => {
          if (activity && onCreateLinkedRideshare) onCreateLinkedRideshare(activity);
        },
        requestJoin: peekJoin.handleJoin,
        shareActivity: () => {
          if (activity && onShareHostedActivity) {
            onShareHostedActivity(activity);
            return;
          }
          const card = selectedCard;
          if (!card?.sharePath) return;
          const url = buildShareUrl(card.sharePath);
          const text = buildShareText(card.shareTitle, card.shareText ?? undefined);
          if (typeof navigator !== 'undefined' && navigator.share) {
            void navigator.share({ title: card.shareTitle, text, url }).catch(() => undefined);
          }
        },
        manageActivity: () => {
          if (!activity) return;
          if (onOpenHostManage) {
            onOpenHostManage(activity, 'participants');
            return;
          }
          setSelectedId(null);
          navigate(`${activityDetailPath(activity.id)}?tab=buddies`);
        },
        withdrawJoin: () => {
          if (peekJoin.joinUiState.kind === 'pending' || peekJoin.joinUiState.kind === 'confirmed') {
            peekJoin.joinActions.setShowWithdraw(true);
          }
        },
        viewDetail: () => {
          if (!activity) return;
          setSelectedId(null);
          navigate(activityDetailPath(activity.id));
        },
      });
    },
    [
      selected?.activity,
      selectedCard,
      handleHostMessage,
      handleMessageActivityHost,
      handleInviteCrew,
      peekJoin.handleJoin,
      peekJoin.joinActions,
      peekJoin.joinUiState.kind,
      onCreateLinkedRideshare,
      onOpenHostManage,
      onShareHostedActivity,
      navigate,
      setSelectedId,
    ]
  );

  const handleOfferTransport = useCallback(() => {
    handleActivityMapPeekAction('offer_rideshare');
  }, [handleActivityMapPeekAction]);

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

  const handleDemandSubmitted = useCallback(
    async (result: DemandSubmitResult) => {
      invalidateMySeekingPostsQueries(queryClient);
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
    [queryClient, setSelectedId, handleFocusMapLocation, isDesktop, setListOpen]
  );

  const handleContributeSubmitted = useCallback(
    (result: ContributeSubmitResult) => {
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
    handleActivityMapPeekAction,
    handleOfferTransport,
    joinUiState: peekJoin.joinUiState,
    joinStateLoading: peekJoin.joinStateLoading,
    peekJoinUiState: peekJoin.peekJoinUiState,
    peekJoinStateLoading: peekJoin.peekJoinStateLoading,
    joinActions: peekJoin.joinActions,
    handlePeekJoinSuccess: peekJoin.handlePeekJoinSuccess,
    demandNotice,
    venueNotice,
    setDemandNotice,
    setVenueNotice,
    openItem,
    handleGuestGatedAction: peekJoin.handleGuestGatedAction,
    handleJoin: peekJoin.handleJoin,
    handlePeekOrganizerMessage: peekJoin.handlePeekOrganizerMessage,
    handleHostMessage,
    handleInviteCrew,
    requestHostRemove: removals.requestHostRemove,
    hostRemoveConfirm: removals.hostRemoveConfirm,
    setHostRemoveConfirm: removals.setHostRemoveConfirm,
    confirmHostRemove: removals.confirmHostRemove,
    hostRemoveBusy: removals.hostRemoveBusy,
    handleActivityPublished,
    tryOpenActivityPinDeepLink,
    handleCloseSelection,
    handleDemandSubmitted,
    handleContributeSubmitted,
  };
};
