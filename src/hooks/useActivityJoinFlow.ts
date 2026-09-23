import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ActivityDTO,
  ActivityDetailDTO,
  ActivityParticipationDTO,
  MyActivityRequestDTO,
  WithdrawReason,
} from '@uaetrail/shared-types';
import { api } from '../api/services';
import {
  resolveJoinRequestUiState,
  withdrawModalVariant,
  type JoinRequestUiState,
} from '../utils/joinRequestUi';

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
  const [context, setContext] = useState<ActivityJoinContext | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!activityId || !userId) {
      setContext(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getPublicActivityDetail(activityId);
      setContext({
        myRequest: res.data.myRequest ?? null,
        participation: res.data.myParticipation ?? null,
      });
    } catch {
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, userId]);

  useEffect(() => {
    if (!enabled || !activityId || !userId) {
      setContext(null);
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, activityId, userId, reload]);

  const uiState = useMemo(
    () => resolveJoinRequestUiState(context ?? {}),
    [context]
  );

  return { context, uiState, loading, reload };
};

export interface UseActivityJoinActionsOptions {
  activity: ActivityJoinTarget | null;
  uiState: JoinRequestUiState;
  requestIdFallback?: string | null;
  onReload: () => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}

/** Shared join modal + withdraw handlers for detail and explore. */
export const useActivityJoinActions = ({
  activity,
  uiState,
  requestIdFallback = null,
  onReload,
  onMessage,
  onError,
}: UseActivityJoinActionsOptions) => {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);

  const openJoinModal = useCallback(() => {
    if (uiState.kind !== 'open') return;
    setJoinModalOpen(true);
  }, [uiState.kind]);

  const closeJoinModal = useCallback(() => {
    setJoinModalOpen(false);
  }, []);

  const openGuestSheet = useCallback(() => {
    setGuestSheetOpen(true);
  }, []);

  const closeGuestSheet = useCallback(() => {
    setGuestSheetOpen(false);
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
        await api.cancelJoinRequest(activity.id, requestId, payload);
        setShowWithdraw(false);
        onMessage?.(
          uiState.kind === 'confirmed'
            ? 'You have withdrawn from this activity.'
            : 'Join request cancelled.'
        );
        await onReload();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Could not withdraw');
        setShowWithdraw(false);
      } finally {
        setWithdrawing(false);
      }
    },
    [activity, uiState, requestIdFallback, onMessage, onError, onReload]
  );

  return {
    joinModalOpen,
    showWithdraw,
    setShowWithdraw,
    withdrawing,
    guestSheetOpen,
    openJoinModal,
    closeJoinModal,
    openGuestSheet,
    closeGuestSheet,
    handleJoinSuccess,
    handleWithdraw,
    withdrawVariant: withdrawModalVariant(uiState),
  };
};

export type ActivityJoinActions = ReturnType<typeof useActivityJoinActions>;
