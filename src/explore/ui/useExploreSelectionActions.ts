import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import type { ActivityDTO, ExploreMapItemDTO, UserRole } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { buildExploreMapItemFromActivity, parseActivityMapItemId } from '../privateActivityExploreItem';
import { api } from '../../api/index';
import { buildExploreCardModel } from '../exploreCardModel';
import { resolveLinkedRideshareRows } from '../linkedRideshareExplore';
import { canOfferCarpoolForDemandItem } from '../linkActivityCarpoolOffer';
import { messagesRouteForRole } from '../../utils/authRouting';
import { activityHostUserId } from '../../utils/hostLabels';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { exploreMapQueryKey, reloadExploreMap } from '../../hooks/useExploreMap';
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
  clearFulfillPrefill: () => void;
  fulfillIntentPrefill: unknown;
  clearFulfillAfterPublish: () => void;
  handleFocusMapLocation: (coords: { lat: number; lng: number }) => void;
  setLinkOnlyPeekItems: Dispatch<SetStateAction<ExploreMapItemDTO[]>>;
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
  clearFulfillPrefill,
  fulfillIntentPrefill,
  clearFulfillAfterPublish,
  handleFocusMapLocation,
  setLinkOnlyPeekItems,
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
    const linkedRideshares = resolveLinkedRideshareRows(selected, items);
    let activity = selected.activity;
    if (activity?.linkedActivityId && !activity.linkedParentActivity) {
      const parentItem = items.find((entry) => entry.activity?.id === activity!.linkedActivityId);
      if (parentItem?.activity) {
        activity = {
          ...activity,
          linkedParentActivity: {
            id: parentItem.activity.id,
            title: parentItem.title,
            activityType: parentItem.activity.activityType,
          },
        };
      }
    }
    const card = {
      ...buildExploreCardModel(selected),
      activity,
      linkedRideshares: linkedRideshares.length > 0 ? linkedRideshares : undefined,
    };
    const hostUserId = activity ? activityHostUserId(activity) : null;
    const isOwnActivity = Boolean(user && activity && hostUserId === user.id);
    const isOwnDemand = Boolean(
      user &&
        selected.source === 'demand' &&
        selected.requesterUserId === user.id &&
        selected.participantIntentId &&
        !selected.convertedActivityId
    );
    if (isOwnDemand) {
      return {
        ...card,
        showJoinActions: false,
        showDemandOwnerActions: true,
        showDemandLinkCarpool: canOfferCarpoolForDemandItem(selected),
      };
    }
    if (!isOwnActivity) return card;
    return {
      ...card,
      showJoinActions: false,
      showHostActions: true,
    };
  }, [selected, items, user, tenantId]);

  const joinContextEnabled = Boolean(selected?.activity?.id && !selectedCard?.showHostActions && user);
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
      clearFulfillPrefill();
      setSelectedId(item.id);
      if (!isDesktop) {
        browse.setListOpen(false);
      }
    },
    [closeCompose, clearFulfillPrefill, isDesktop, browse, setSelectedId]
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
    if (selected?.source === 'demand') {
      respondToDemand(selected);
      return;
    }
    if (!selected?.activity) return;
    if (!user) {
      joinActions.openGuestSheet('activity');
      return;
    }
    if (joinUiState.kind !== 'open') return;
    joinActions.openJoinModal();
  }, [selected, user, joinUiState.kind, joinActions, respondToDemand]);

  const handleDemandMessage = useCallback(() => {
    if (selected) respondToDemand(selected);
  }, [selected, respondToDemand]);

  const handleHostMessage = useCallback(async () => {
    const activity = selected?.activity;
    if (!activity) return;
    try {
      const res = await api.getActivityGroupChat(activity.id);
      setSelectedId(null);
      navigate(`/groups?group=${encodeURIComponent(res.data.groupId)}`);
    } catch (err) {
      setDemandNotice(err instanceof Error ? err.message : 'Could not open activity chat.');
    }
  }, [selected, navigate, setSelectedId]);

  const handleHostManage = useCallback(() => {
    const activity = selected?.activity;
    if (!activity) return;
    setSelectedId(null);

    if (activity.status === 'published' && tenantId) {
      navigate(`/host/activities?checkin=${encodeURIComponent(activity.id)}`);
      return;
    }

    navigate(`/trips?segment=upcoming&tab=hosted&checkin=${encodeURIComponent(activity.id)}`);
  }, [selected, tenantId, navigate, setSelectedId]);

  const requestHostRemove = useCallback(() => {
    const activity = selected?.activity;
    if (!activity) return;
    if (activity.status !== 'draft' && activity.status !== 'published') return;
    setHostRemoveConfirm(activity);
  }, [selected?.activity]);

  const requestDemandRemove = useCallback(() => {
    const intentId = selected?.participantIntentId;
    if (!intentId || selected?.source !== 'demand') return;
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

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !tenantId) return;
    setHostRemoveBusy(true);
    try {
      await api.cancelOrganisationActivity(tenantId, hostRemoveConfirm.id);
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

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (fulfillIntentPrefill) {
        setDemandNotice('Activity published and linked to the community request.');
        clearFulfillAfterPublish();
      }

      if (activity.joinMode === 'private') {
        await reloadExploreMap(queryClient);
        const peekItem = buildExploreMapItemFromActivity(activity);
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
    [
      queryClient,
      browse,
      handleFocusMapLocation,
      fulfillIntentPrefill,
      clearFulfillAfterPublish,
      setSelectedId,
      setLinkOnlyPeekItems,
    ]
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
        if (res.data.visibilityState === 'private') {
          setDemandNotice(
            res.data.message ?? 'This private plan is only available to signed-in members with the link.'
          );
          return 'denied';
        }
        const peekItem = buildExploreMapItemFromActivity(res.data);
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
    joinUiState,
    joinStateLoading,
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
    handleHostManage,
    requestHostRemove,
    hostRemoveConfirm,
    setHostRemoveConfirm,
    confirmHostRemove,
    hostRemoveBusy,
    demandRemoveIntentId,
    setDemandRemoveIntentId,
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
