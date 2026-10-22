import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActivityDTO,
  ActivityDetailDTO,
  ActivityMapPeekActionId,
  ActivityParticipationDTO,
  MyActivityRequestDTO,
  WithdrawReason,
} from '@uaetrail/shared-types';
import { afterActivityWithdrawClientRefresh } from './activityJoinClientEffects';
import { cancelJoinRequest } from './activityJoinClientApi';
import { activityDetailQueryKey } from './clientQueryKeys';
import { fetchPublicActivityDetail } from './usePublicActivityDetail';
import {
  resolveJoinRequestUiState,
  withdrawModalVariant,
  type JoinRequestUiState,
} from '../utils/joinRequestUi';
import type { GuestBrowseGateIntent } from '../content/guestBrowseGateCopy';

export type GuestSheetSurface = 'join' | 'browse';

export type ActivityJoinContext = {
  myRequest: MyActivityRequestDTO | null;
  participation: ActivityParticipationDTO | null;
};

type ActivityJoinTarget = ActivityDTO | ActivityDetailDTO;

export interface UseActivityJoinContextOptions {
  activityId: string | null | undefined;
  enabled?: boolean;
  userId?: string | null;
}

/** Load myRequest + participation for an activity (explore peek). */
export const useActivityJoinContext = ({
  activityId,
  enabled = true,
  userId,
}: UseActivityJoinContextOptions) => {
  const queryEnabled = enabled && Boolean(activityId && userId);
  const { data, isLoading, refetch } = useQuery({
    queryKey: activityId
      ? activityDetailQueryKey(activityId, userId ?? 'guest')
      : ['activity', '', userId ?? 'guest'],
    queryFn: () => fetchPublicActivityDetail(activityId!),
    enabled: queryEnabled,
    staleTime: 60_000,
  });

  const context = useMemo<ActivityJoinContext | null>(() => {
    if (!data) return null;
    return {
      myRequest: data.myRequest,
      participation: data.participation,
    };
  }, [data]);

  const reload = useCallback(async () => {
    if (!queryEnabled) return;
    await refetch();
  }, [queryEnabled, refetch]);

  const uiState = useMemo(
    () => resolveJoinRequestUiState(context ?? {}),
    [context]
  );

  return {
    context,
    uiState,
    /** Initial load only — background refetch must not blank map/list peek CTAs. */
    loading: queryEnabled && isLoading,
    reload,
  };
};

export interface UseActivityJoinActionsOptions {
  activity: ActivityJoinTarget | null;
  uiState: JoinRequestUiState;
  requestIdFallback?: string | null;
  /** When set, join modal cannot open (e.g. women-only gender gate). */
  joinGuardMessage?: string | null;
  onReload: () => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}

/** Shared join modal + withdraw handlers for detail and explore. */
export const useActivityJoinActions = ({
  activity,
  uiState,
  requestIdFallback = null,
  joinGuardMessage = null,
  onReload,
  onMessage,
  onError,
}: UseActivityJoinActionsOptions) => {
  const queryClient = useQueryClient();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [guestSheetIntent, setGuestSheetIntent] = useState<'activity' | 'place'>('activity');
  const [guestSheetSurface, setGuestSheetSurface] = useState<GuestSheetSurface>('join');
  const [guestBrowseGateIntent, setGuestBrowseGateIntent] =
    useState<GuestBrowseGateIntent>('peek-details');
  const [guestPendingPeekAction, setGuestPendingPeekAction] =
    useState<ActivityMapPeekActionId | null>(null);

  const openJoinModal = useCallback(() => {
    if (joinGuardMessage) {
      onError?.(joinGuardMessage);
      return;
    }
    if (uiState.kind !== 'open') return;
    setJoinModalOpen(true);
  }, [uiState.kind, joinGuardMessage, onError]);

  const closeJoinModal = useCallback(() => {
    setJoinModalOpen(false);
  }, []);

  const openGuestSheet = useCallback(
    (intent: 'activity' | 'place' = 'activity', pendingAction: ActivityMapPeekActionId = 'request_join') => {
      setGuestSheetSurface('join');
      setGuestSheetIntent(intent);
      setGuestPendingPeekAction(pendingAction);
      setGuestSheetOpen(true);
    },
    []
  );

  const openGuestBrowseGate = useCallback(
    (intent: GuestBrowseGateIntent = 'peek-details', pendingAction: ActivityMapPeekActionId = 'view_detail') => {
      setGuestSheetSurface('browse');
      setGuestBrowseGateIntent(intent);
      setGuestPendingPeekAction(pendingAction);
      setGuestSheetOpen(true);
    },
    []
  );

  const closeGuestSheet = useCallback(() => {
    setGuestSheetOpen(false);
    setGuestSheetIntent('activity');
    setGuestSheetSurface('join');
    setGuestBrowseGateIntent('peek-details');
    setGuestPendingPeekAction(null);
  }, []);

  const handleJoinSuccess = useCallback(
    (message: string) => {
      onMessage?.(message);
      setJoinModalOpen(false);
      void onReload();
    },
    [onMessage, onReload]
  );

  const handleWithdraw = useCallback(
    async (payload: { reason: WithdrawReason; message?: string }) => {
      if (!activity) return;
      if (uiState.kind !== 'pending' && uiState.kind !== 'confirmed') return;

      const requestId =
        uiState.kind === 'pending' || uiState.kind === 'confirmed'
          ? uiState.requestId
          : requestIdFallback;
      if (!requestId) return;

      setWithdrawing(true);
      try {
        await cancelJoinRequest(activity.id, requestId, payload);
        setShowWithdraw(false);
        onMessage?.(
          uiState.kind === 'confirmed'
            ? 'Your request to join has been withdrawn.'
            : 'Join request cancelled.'
        );
        await afterActivityWithdrawClientRefresh(queryClient, { activityId: activity.id });
        await onReload();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Could not withdraw');
        setShowWithdraw(false);
      } finally {
        setWithdrawing(false);
      }
    },
    [activity, uiState, requestIdFallback, onMessage, onError, onReload, queryClient]
  );

  return {
    joinModalOpen,
    showWithdraw,
    setShowWithdraw,
    withdrawing,
    guestSheetOpen,
    guestSheetIntent,
    guestSheetSurface,
    guestBrowseGateIntent,
    guestPendingPeekAction,
    openJoinModal,
    closeJoinModal,
    openGuestSheet,
    openGuestBrowseGate,
    closeGuestSheet,
    handleJoinSuccess,
    handleWithdraw,
    withdrawVariant: withdrawModalVariant(uiState),
  };
};

export type ActivityJoinActions = ReturnType<typeof useActivityJoinActions>;
