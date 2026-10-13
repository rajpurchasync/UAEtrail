import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import {
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ActivityMapPeekActionId,
  type ExploreMapItemDTO,
  type UserRole,
} from '@uaetrail/shared-types';
import {
  activityDetailPath,
  resolveActivityDisplayCoordinates,
  resolveActivityHostUserId,
  resolveParticipationMode,
} from '@uaetrail/shared-types';
import { buildShareText, buildShareUrl } from '../../utils/share';
import { hostPublishedActivityPeekAccess } from '../../access/resolvePeekDetailAccess';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import {
  findExploreMapItemForPinId,
  resolveActivityIdForExplorePinId,
} from '../exploreMapPinResolve';
import { cancelHostActivityById } from '../../hooks/hostActivityClientApi';
import {
  cancelParticipantIntent,
  createParticipantIntentJoinRequest,
  invalidateMyParticipantIntentsQueries,
} from '../../hooks/participantIntentClientApi';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { buildDiscoveryCardViewModel } from '../../discovery';
import { canShowDemandLinkRideshareOffer } from '../linkActivityRideshareOffer';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import { executeActivityMapPeekAction } from '../../activity/executeActivityMapPeekAction';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekSkipsJoinContext,
} from '../../activity/activityPeekEngagement';
import { viewerIsActivityHostUser } from '../../utils/viewerHostsActivity';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useParticipantIntentJoinContext } from '../../hooks/useParticipantIntentJoinContext';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { readExploreMapItemsFromCache, reloadExploreMap } from '../../hooks/useExploreMap';
import { isExploreMapVnextEnabled } from '../exploreMapVnext';
import { navigateToParticipantIntentManage } from '../../member-plan/navigateParticipantIntentManage';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';
import type { useExploreBrowseUrlState } from './useExploreBrowseUrlState';
import type { HostActivityManageInitialView } from '../../components/host/hostActivityManageViews';

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
  /** Host peek `manage_activity` — open manage sheet without leaving explore. */
  onOpenHostManage?: (
    activity: ActivityDTO,
    initialView?: HostActivityManageInitialView
  ) => void;
  /** Host peek `share_activity` — invite + link share sheet (not web-only). */
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
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);
  const [demandRemoveIntentId, setDemandRemoveIntentId] = useState<string | null>(null);
  const [demandRemoveBusy, setDemandRemoveBusy] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const viewerGender = useViewerProfileGender(user?.id);
  const joinGuardMessage = useMemo(
    () => womenOnlyJoinMessageForActivity(selected?.activity?.requirements, viewerGender),
    [selected?.activity?.requirements, viewerGender]
  );

  const selectedCard = useMemo(() => {
    if (!selected) return null;
    const card = buildDiscoveryCardViewModel(selected, { mapItems: items }).card;
    const activity = card.activity;
    const isOwnActivity = Boolean(
      user &&
        activity &&
        selected.source === 'activity' &&
        viewerIsActivityHostUser(activity, user.id)
    );
    const activityHostPeek = isOwnActivity;
    const isOwnDemand = Boolean(
      user &&
        exploreMapItemIsSeeking(selected) &&
        selected.requesterUserId === user.id &&
        selected.participantIntentId &&
        !selected.convertedActivityId
    );
    if (isOwnDemand) {
      return {
        ...card,
        showJoinActions: false,
        showDemandOwnerActions: true,
        showDemandLinkRideshare: canShowDemandLinkRideshareOffer(selected),
      };
    }
    if (!activityHostPeek) return card;
    return {
      ...card,
      showJoinActions: false,
    };
  }, [selected, items, user]);

  const joinContextEnabled = Boolean(
    selected?.activity?.id &&
      user &&
      selectedCard &&
      activityMapPeekNeedsJoinContext(selectedCard)
  );
  const {
    context: joinContext,
    uiState: joinUiState,
    loading: joinStateLoading,
    reload: reloadJoinContext,
  } = useActivityJoinContext({
    activityId: selected?.activity?.id,
    enabled: joinContextEnabled,
    userId: user?.id,
  });

  const seekingUsesLegacyIntentJoin = Boolean(
    selected &&
      exploreMapItemIsSeeking(selected) &&
      selected.participantIntentId &&
      !selected.activity?.id
  );
  const demandJoinContextEnabled = Boolean(
    seekingUsesLegacyIntentJoin &&
      !selectedCard?.showDemandOwnerActions &&
      user
  );
  const {
    uiState: demandJoinUiState,
    loading: demandJoinStateLoading,
    reload: reloadDemandJoinContext,
  } = useParticipantIntentJoinContext({
    intentId: selected?.participantIntentId,
    enabled: demandJoinContextEnabled,
    userId: user?.id,
  });

  const activityPeekSkipsJoinContext = useMemo(
    () =>
      Boolean(
        selectedCard &&
          activityMapPeekSkipsJoinContext(selectedCard, joinUiState)
      ),
    [selectedCard, joinUiState]
  );

  const peekJoinUiState =
    demandJoinContextEnabled
      ? demandJoinUiState
      : activityPeekSkipsJoinContext
        ? undefined
        : joinUiState;
  const peekJoinStateLoading = demandJoinContextEnabled ? demandJoinStateLoading : joinStateLoading;

  const joinActions = useActivityJoinActions({
    activity: selected?.activity ?? null,
    uiState: joinUiState,
    requestIdFallback: joinContext?.myRequest?.id ?? null,
    joinGuardMessage,
    onReload: reloadJoinContext,
    onMessage: setDemandNotice,
    onError: setDemandNotice,
  });

  const handlePeekJoinSuccess = useCallback(
    (message: string) => {
      joinActions.handleJoinSuccess(message);
    },
    [joinActions]
  );

  const openItem = useCallback(
    (item: ExploreMapItemDTO) => {
      closeCompose();
      setSelectedId(item.id);
      if (!isDesktop) {
        browse.setListOpen(false);
      }
    },
    [closeCompose, isDesktop, browse, setSelectedId]
  );

  const respondToDemand = useCallback(
    (item: ExploreMapItemDTO) => {
      const requesterId = item.requesterUserId;
      if (!requesterId) return;
      if (!user) {
        joinActions.openGuestSheet('activity');
        return;
      }
      navigate(messagesRouteForRole((user.role ?? 'participant') as UserRole, requesterId));
      setSelectedId(null);
    },
    [user, navigate, joinActions, setSelectedId]
  );

  const handleGuestGatedAction = useCallback(() => {
    if (user) return;
    const intent =
      selected?.source === 'venue' || selected?.source === 'shop' ? 'place' : 'activity';
    joinActions.openGuestSheet(intent);
  }, [user, selected?.source, joinActions]);

  const handleJoin = useCallback(() => {
    if (selected && exploreMapItemIsSeeking(selected)) {
      if (!user) {
        joinActions.openGuestSheet('activity');
        return;
      }
      if (selected.activity?.id) {
        if (joinUiState.kind !== 'open') return;
        joinActions.openJoinModal();
        return;
      }
      const intentId = selected.participantIntentId;
      if (!intentId) return;
      if (demandJoinUiState.kind !== 'open') return;
      void (async () => {
        try {
          await createParticipantIntentJoinRequest(intentId);
          await reloadDemandJoinContext();
          setDemandNotice('Request sent — they’ll review your request.');
        } catch (err) {
          setDemandNotice(err instanceof Error ? err.message : 'Could not send your request.');
        }
      })();
      return;
    }
    if (!selected?.activity) return;
    if (!user) {
      joinActions.openGuestSheet('activity');
      return;
    }
    if (joinUiState.kind !== 'open') return;
    joinActions.openJoinModal();
  }, [selected, user, joinUiState.kind, demandJoinUiState.kind, joinActions, reloadDemandJoinContext]);

  const handleDemandMessage = useCallback(() => {
    if (selected) respondToDemand(selected);
  }, [selected, respondToDemand]);

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
      joinActions.openGuestSheet('activity');
      return;
    }
    setSelectedId(null);
    navigate(
      messagesRouteForRole((user.role ?? 'participant') as UserRole, hostUserId, {
        activityId: activity.id,
      })
    );
  }, [selected, user, navigate, setSelectedId, joinActions]);

  const handleInviteCrew = useCallback(() => {
    const activity = selected?.activity;
    if (!activity || activity.status !== 'published') return;
    onInviteActivity?.(activity, { canSendBuddyInvites: true });
  }, [onInviteActivity, selected?.activity]);

  const requestHostRemove = useCallback((activity: ActivityDTO) => {
    if (activity.status !== 'draft' && activity.status !== 'published') return;
    setHostRemoveConfirm(activity);
  }, []);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !tenantId) return;
    setHostRemoveBusy(true);
    try {
      await cancelHostActivityById(tenantId, hostRemoveConfirm.id);
      const wasDraft = hostRemoveConfirm.status === 'draft';
      setHostRemoveConfirm(null);
      setSelectedId(null);
      await reloadExploreMap(queryClient);
      setVenueNotice(wasDraft ? 'Draft deleted.' : 'Activity cancelled.');
    } catch (err) {
      setVenueNotice(err instanceof Error ? err.message : 'Could not update activity.');
    } finally {
      setHostRemoveBusy(false);
    }
  }, [hostRemoveConfirm, tenantId, queryClient, setSelectedId]);

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
        requestJoin: handleJoin,
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
          if (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') {
            joinActions.setShowWithdraw(true);
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
      handleJoin,
      joinActions,
      joinUiState.kind,
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

  const handleDemandManage = useCallback(() => {
    const intentId = selected?.participantIntentId;
    if (!intentId || !exploreMapItemIsSeeking(selected)) return;
    setSelectedId(null);
    navigateToParticipantIntentManage(navigate, intentId);
  }, [selected, navigate, setSelectedId]);

  const requestDemandRemove = useCallback(() => {
    const intentId = selected?.participantIntentId;
    if (!intentId || !exploreMapItemIsSeeking(selected)) return;
    setDemandRemoveIntentId(intentId);
  }, [selected]);

  const confirmDemandRemove = useCallback(async () => {
    if (!demandRemoveIntentId) return;
    setDemandRemoveBusy(true);
    try {
      await cancelParticipantIntent(demandRemoveIntentId);
      invalidateMyParticipantIntentsQueries(queryClient);
      setDemandRemoveIntentId(null);
      setSelectedId(null);
      await reloadExploreMap(queryClient);
      setDemandNotice('Request removed from the map.');
    } catch (err) {
      setDemandNotice(err instanceof Error ? err.message : 'Could not remove this request.');
    } finally {
      setDemandRemoveBusy(false);
    }
  }, [demandRemoveIntentId, queryClient, setSelectedId]);

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (activity.joinMode === 'private') {
        if (isExploreMapVnextEnabled()) {
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

      if (isExploreMapVnextEnabled()) {
        await reloadExploreMap(queryClient);
      }

      const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
      if (latitude != null && longitude != null) {
        handleFocusMapLocation({ lat: latitude, lng: longitude });
        setSelectedId(`activity:${activity.id}`);
      }

    },
    [queryClient, syncExploreUrl, setMapFilter, setActivityFilter, handleFocusMapLocation, setSelectedId, setLinkOnlyPeekItems]
  );

  type ActivityPinDeepLinkResult = 'opened' | 'not_activity' | 'auth_required' | 'denied' | 'error';

  const tryOpenActivityPinDeepLink = useCallback(
    async (mapItemId: string): Promise<ActivityPinDeepLinkResult> => {
      const existing = findExploreMapItemForPinId(items, mapItemId);
      if (existing) {
        openItem(existing);
        return 'opened';
      }

      const activityId = resolveActivityIdForExplorePinId(items, mapItemId);
      if (!activityId) return 'not_activity';
      if (!user) return 'auth_required';

      try {
        const detail = await fetchPublicActivityDetail(activityId);
        if (detail.viewerAccess?.exposure === 'none') {
          setDemandNotice(
            detail.activity.message ??
              'This private plan is only available to signed-in members with the link.'
          );
          return 'denied';
        }
        const peekItem = buildExploreMapItemFromActivity(detail.activity, detail.viewerAccess);
        setLinkOnlyPeekItems((prev) => {
          const rest = prev.filter((entry) => entry.id !== peekItem.id);
          return [...rest, peekItem];
        });
        const { latitude, longitude } = resolveActivityDisplayCoordinates(detail.activity);
        if (latitude != null && longitude != null) {
          handleFocusMapLocation({ lat: latitude, lng: longitude });
        }
        setSelectedId(peekItem.id);
        if (!isDesktop) {
          setListOpen(false);
        }
        return 'opened';
      } catch {
        setDemandNotice('Could not open this plan — check the link or try again.');
        return 'error';
      }
    },
    [
      items,
      openItem,
      user,
      setLinkOnlyPeekItems,
      handleFocusMapLocation,
      setSelectedId,
      isDesktop,
      setListOpen,
    ]
  );

  const handleCloseSelection = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  const handleDemandSubmitted = useCallback(
    async (result: DemandSubmitResult) => {
      invalidateMyParticipantIntentsQueries(queryClient);
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
        browse.setListOpen(false);
      }
    },
    [queryClient, setSelectedId, handleFocusMapLocation, isDesktop, browse]
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
    activityPeekSkipsJoinContext,
    handleActivityMapPeekAction,
    handleOfferTransport,
    joinUiState,
    joinStateLoading,
    peekJoinUiState,
    peekJoinStateLoading,
    joinActions,
    handlePeekJoinSuccess,
    demandNotice,
    venueNotice,
    setDemandNotice,
    setVenueNotice,
    openItem,
    handleGuestGatedAction,
    handleJoin,
    handleDemandMessage,
    handleHostMessage,
    handleInviteCrew,
    requestHostRemove,
    hostRemoveConfirm,
    setHostRemoveConfirm,
    confirmHostRemove,
    hostRemoveBusy,
    demandRemoveIntentId,
    setDemandRemoveIntentId,
    handleDemandManage,
    requestDemandRemove,
    confirmDemandRemove,
    demandRemoveBusy,
    handleActivityPublished,
    tryOpenActivityPinDeepLink,
    handleCloseSelection,
    handleDemandSubmitted,
    handleContributeSubmitted,
  };
};
