import { useCallback, useMemo, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import type { ActivityDTO, ExploreMapItemDTO, UserRole } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { buildExploreCardModel } from '../exploreCardModel';
import { messagesRouteForRole } from '../../utils/authRouting';
import { activityHostUserId } from '../../utils/hostLabels';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';
import {
  canLinkCarpoolToActivity,
  linkActivityCarpoolOffer,
} from '../linkActivityCarpoolOffer';
import { ORGANIZE_CARPOOL_LINKED_NOTICE } from '../createFlowCopy';
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
  openEdit: (activity: ActivityDTO, opts: { tenantId: string }) => void;
  handleFocusMapLocation: (coords: { lat: number; lng: number }) => void;
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
  openEdit,
  handleFocusMapLocation,
}: UseExploreSelectionActionsArgs) => {
  const [demandNotice, setDemandNotice] = useState<string | null>(null);
  const [venueNotice, setVenueNotice] = useState<string | null>(null);
  const [carpoolLinkActivityId, setCarpoolLinkActivityId] = useState<string | null>(null);
  const [carpoolLinkLoading, setCarpoolLinkLoading] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const selectedCard = useMemo(() => {
    if (!selected) return null;
    const card = buildExploreCardModel(selected);
    const activity = selected.activity;
    const hostUserId = activity ? activityHostUserId(activity) : null;
    const isOwnActivity = Boolean(
      user &&
        activity &&
        (hostUserId === user.id || (tenantId && activity.tenantId === tenantId))
    );
    if (!isOwnActivity) return card;
    return {
      ...card,
      showJoinActions: false,
      showHostActions: true,
    };
  }, [selected, user, tenantId]);

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

    if (tenantId) {
      openEdit(activity, { tenantId });
      return;
    }

    navigate(`/activities?tab=hosted&checkin=${encodeURIComponent(activity.id)}`);
  }, [selected, tenantId, navigate, openEdit, setSelectedId]);

  const handleActivityPublished = useCallback(
    async (activity: ActivityDTO) => {
      if (fulfillIntentPrefill) {
        setDemandNotice('Activity published and linked to the community request.');
        clearFulfillAfterPublish();
      }

      if (activity.joinMode === 'private') {
        await reloadExploreMap(queryClient);
        setVenueNotice(
          'Activity published privately — share the link with your group. It will not appear on the public map.'
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

      if (canLinkCarpoolToActivity(activity)) {
        setCarpoolLinkActivityId(activity.id);
      }
    },
    [
      queryClient,
      browse,
      handleFocusMapLocation,
      fulfillIntentPrefill,
      clearFulfillAfterPublish,
      setSelectedId,
    ]
  );

  const handleLinkCarpool = useCallback(async () => {
    const activity = selected?.activity;
    if (!activity || !tenantId || !canLinkCarpoolToActivity(activity)) return;

    setCarpoolLinkLoading(true);
    try {
      await linkActivityCarpoolOffer(tenantId, activity);
      await reloadExploreMap(queryClient);
      setCarpoolLinkActivityId(null);
      setVenueNotice(ORGANIZE_CARPOOL_LINKED_NOTICE);
    } catch (err) {
      setVenueNotice(err instanceof Error ? err.message : 'Could not link carpool. Try again.');
    } finally {
      setCarpoolLinkLoading(false);
    }
  }, [selected?.activity, tenantId, queryClient]);

  const showCarpoolLinkOnPeek = Boolean(
    selected?.activity &&
      carpoolLinkActivityId === selected.activity.id &&
      canLinkCarpoolToActivity(selected.activity)
  );

  const handleCloseSelection = useCallback(() => {
    setSelectedId(null);
    setCarpoolLinkActivityId(null);
  }, [setSelectedId]);

  const handleDemandSubmitted = useCallback(
    (result: DemandSubmitResult) => {
      void reloadExploreMap(queryClient);
      if (!result.visibleOnMap) {
        setDemandNotice(
          'Request posted. Add a map pin next time to show on Explore — nearby hosts can still message you.'
        );
      } else {
        setDemandNotice(
          'Request posted on the map. Nearby hosts and guides can message you or propose a matching activity.'
        );
      }
    },
    [queryClient]
  );

  const handleContributeSubmitted = useCallback(
    (result: ContributeSubmitResult) => {
      void reloadExploreMap(queryClient);
      if (result.kind === 'shop') {
        setVenueNotice('Shop submitted for review. We\'ll notify you once it\'s on the map.');
      } else {
        setVenueNotice(
          `"${result.location.name}" submitted for admin review. You'll see it on the map once published.`
        );
      }
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
    handleActivityPublished,
    handleLinkCarpool,
    showCarpoolLinkOnPeek,
    carpoolLinkLoading,
    handleCloseSelection,
    handleDemandSubmitted,
    handleContributeSubmitted,
  };
};
