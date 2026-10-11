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
import { resolveActivityDisplayCoordinates, resolveActivityHostUserId } from '@uaetrail/shared-types';
import { hostPublishedActivityPeekAccess } from '../../access/resolvePeekDetailAccess';
import { buildExploreMapItemFromActivity, parseActivityMapItemId } from '../privateActivityExploreItem';
import { api } from '../../api/index';
import { buildExploreCardModel } from '../exploreCardModel';
import { finalizeExploreCardLinkedRideshare } from '../linkedRideshareExplore';
import { canShowDemandLinkRideshareOffer } from '../linkActivityRideshareOffer';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekSkipsJoinContext,
} from '../../activity/activityPeekEngagement';
import { viewerIsActivityHostUser } from '../../utils/viewerHostsActivity';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useParticipantIntentJoinContext } from '../../hooks/useParticipantIntentJoinContext';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { exploreMapQueryKey, reloadExploreMap } from '../../hooks/useExploreMap';
import { navigateToParticipantIntentManage } from '../../member-plan/navigateParticipantIntentManage';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';
import type { useExploreBrowseUrlState } from './useExploreBrowseUrlState';

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
}: UseExploreSelectionActionsArgs) => {
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
    const card = finalizeExploreCardLinkedRideshare(buildExploreCardModel(selected), selected, items);
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
      showHostActivityCtas: true,
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
          await api.createParticipantIntentJoinRequest(intentId);
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
      await api.cancelHostActivity(tenantId, hostRemoveConfirm.id);
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
      switch (actionId) {
        case 'open_crew_chat':
          void handleHostMessage();
          return;
        case 'message_host':
          handleMessageActivityHost();
          return;
        case 'invite_crew':
          handleInviteCrew();
          return;
        case 'link_carpool':
          if (activity && onCreateLinkedRideshare) {
            onCreateLinkedRideshare(activity);
          }
          return;
        case 'request_join':
          handleJoin();
          return;
        case 'pending_join':
          return;
        default:
          return;
      }
    },
    [
      selected?.activity,
      handleHostMessage,
      handleMessageActivityHost,
      handleInviteCrew,
      handleJoin,
      onCreateLinkedRideshare,
      navigate,
      setSelectedId,
    ]
  );

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
      await api.cancelParticipantIntent(demandRemoveIntentId);
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
        await reloadExploreMap(queryClient);
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

      browse.setMapFilter('all');
      browse.setActivityFilter('all');
      browse.syncExploreUrl({ filter: 'all', activityFilter: 'all', panel: 'activities' });

      await reloadExploreMap(queryClient);

      const { latitude, longitude } = resolveActivityDisplayCoordinates(activity);
      if (latitude != null && longitude != null) {
        handleFocusMapLocation({ lat: latitude, lng: longitude });
        setSelectedId(`activity:${activity.id}`);
      }

    },
    [queryClient, browse, handleFocusMapLocation, setSelectedId, setLinkOnlyPeekItems]
  );

  type ActivityPinDeepLinkResult = 'opened' | 'not_activity' | 'auth_required' | 'denied' | 'error';

  const tryOpenActivityPinDeepLink = useCallback(
    async (mapItemId: string): Promise<ActivityPinDeepLinkResult> => {
      const existing = items.find((entry) => entry.id === mapItemId);
      if (existing) {
        openItem(existing);
        return 'opened';
      }

      const activityId = parseActivityMapItemId(mapItemId);
      if (!activityId) return 'not_activity';
      if (!user) return 'auth_required';

      try {
        const res = await api.getPublicActivityDetail(activityId);
        if (res.viewerAccess?.exposure === 'none') {
          setDemandNotice(
            res.data.message ?? 'This private plan is only available to signed-in members with the link.'
          );
          return 'denied';
        }
        const peekItem = buildExploreMapItemFromActivity(res.data, res.viewerAccess);
        setLinkOnlyPeekItems((prev) => {
          const rest = prev.filter((entry) => entry.id !== peekItem.id);
          return [...rest, peekItem];
        });
        const { latitude, longitude } = resolveActivityDisplayCoordinates(res.data);
        if (latitude != null && longitude != null) {
          handleFocusMapLocation({ lat: latitude, lng: longitude });
        }
        setSelectedId(peekItem.id);
        if (!isDesktop) {
          browse.setListOpen(false);
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
      browse,
    ]
  );

  const handleCloseSelection = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  const handleDemandSubmitted = useCallback(
    async (result: DemandSubmitResult) => {
      await reloadExploreMap(queryClient);
      if (!result.visibleOnMap) {
        return;
      }
      const mapItems = queryClient.getQueryData<ExploreMapItemDTO[]>(exploreMapQueryKey);
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
    joinUiState,
    joinStateLoading,
    peekJoinUiState,
    peekJoinStateLoading,
    joinActions,
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
