import { useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ActivityDetailDTO, ActivityDTO, UserRole } from '@uaetrail/shared-types';
import type { ActivityManageInitialView } from '../components/activity/activityManageViews';
import { resolveActivityHostUserId } from '@uaetrail/shared-types';
import type { ActivityMapPeekActionHandlers } from './executeActivityMapPeekAction';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../utils/authRouting';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import type { ActivityDetailTabId } from './activityDetailTab';

export type UseActivityDetailMapPeekHandlersInput = {
  activity: ActivityDetailDTO;
  user: { id: string; role?: string } | null | undefined;
  joinUiState: JoinRequestUiState;
  navigate: NavigateFunction;
  onJoin?: () => void;
  onWithdraw?: () => void;
  onHostShareOuting?: () => void;
  onParticipantInviteFriends?: () => void;
  onOfferLinkedRideshare?: () => void;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  onChatError?: (message: string) => void;
  isHostUser?: boolean;
  onOpenHostManage?: (activity: ActivityDTO, initialView?: ActivityManageInitialView) => void;
  /** Public scroll layout — no Buddies tab; open participation manage sheet instead. */
  consumerDetailLayout?: boolean;
  onOpenParticipationManage?: () => void;
};

/** Peek-parity wire action handlers for `/activity/:id` (detail is already open for `view_detail`). */
export const useActivityDetailMapPeekHandlers = (
  input: UseActivityDetailMapPeekHandlersInput
): ActivityMapPeekActionHandlers =>
  useMemo(() => {
    const activity = input.activity;
    const hostUserId = resolveActivityHostUserId(activity);

    return {
      openCrewChat: () => {
        void openActivityGroupChat(input.navigate, activity.id, activity.groupChatId).catch((err) => {
          input.onChatError?.(err instanceof Error ? err.message : 'Could not open activity chat.');
        });
      },
      messageHost: () => {
        if (!hostUserId || !input.user) return;
        input.navigate(
          messagesRouteForRole((input.user.role ?? 'participant') as UserRole, hostUserId, {
            activityId: activity.id,
          })
        );
      },
      inviteCrew: () => {
        if (activity.status !== 'published') return;
        if (input.onParticipantInviteFriends) {
          input.onParticipantInviteFriends();
        } else {
          input.onHostShareOuting?.();
        }
      },
      linkRideshare: () => input.onOfferLinkedRideshare?.(),
      offerRideshare: () => input.onOfferLinkedRideshare?.(),
      requestJoin: () => input.onJoin?.(),
      shareActivity: () => input.onHostShareOuting?.(),
      manageActivity: () => {
        if (input.isHostUser && input.onOpenHostManage) {
          input.onOpenHostManage(activity, 'participants');
          return;
        }
        if (input.consumerDetailLayout && input.onOpenParticipationManage) {
          input.onOpenParticipationManage();
          return;
        }
        input.onMobileTabChange?.('buddies');
      },
      withdrawJoin: () => {
        if (input.joinUiState.kind === 'pending' || input.joinUiState.kind === 'confirmed') {
          input.onWithdraw?.();
        }
      },
      viewDetail: () => undefined,
    };
  }, [input]);
