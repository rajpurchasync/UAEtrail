import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type {
  ActivityMapPeekActionId,
  ExploreMapItemDTO,
  UserRole,
} from '@uaetrail/shared-types';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekSkipsJoinContext,
} from '../../activity/activityPeekEngagement';
import type { DiscoveryCardViewModel } from '../../discovery';
import { applyPeekJoinOpenAfterClick } from '../../activity/resolvePeekJoinOpenAfterClick';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useActivityJoinGuardMessage } from '../../hooks/useActivityJoinGuardMessage';
import { messagesRouteForRole } from '../../utils/authRouting';
import { navigateToMessagesWithReturn } from '../../utils/activityGroupChatNav';
import { buildMapPeekReturnPath } from '../mapPeekDetailNavState';
import { guestExplorePreviewLimitReached } from '../guestMapPreviewPolicy';
import type { Location } from 'react-router-dom';

/** Join context for map peek — activity wire only (hosted + seeking). */
export const useExploreSelectionPeekJoin = (input: {
  selected: ExploreMapItemDTO | null;
  selectedCard: DiscoveryCardViewModel | null;
  user: { id: string; role?: string } | null | undefined;
  setExploreNotice: (message: string | null) => void;
  setSelectedId: (id: string | null) => void;
  navigate: NavigateFunction;
  location: Pick<Location, 'pathname' | 'search'>;
  selectedId: string | null;
}) => {
  const joinGuardMessage = useActivityJoinGuardMessage(
    input.selected?.activity?.requirements,
    input.user?.id
  );

  const joinContextEnabled = Boolean(
    input.selected?.activity?.id &&
      input.user &&
      input.selectedCard?.source === 'activity' &&
      input.selectedCard.showJoinActions &&
      input.selectedCard.viewerAccess?.level !== 'host' &&
      activityMapPeekNeedsJoinContext(input.selectedCard)
  );
  const {
    context: joinContext,
    uiState: joinUiState,
    loading: joinStateLoading,
    reload: reloadJoinContext,
  } = useActivityJoinContext({
    activityId: input.selected?.activity?.id,
    enabled: joinContextEnabled,
    userId: input.user?.id,
  });

  const activityPeekSkipsJoinContext = useMemo(
    () =>
      Boolean(
        input.selectedCard && activityMapPeekSkipsJoinContext(input.selectedCard, joinUiState)
      ),
    [input.selectedCard, joinUiState]
  );

  const peekJoinUiState = joinUiState;
  const peekJoinStateLoading = joinStateLoading;

  const joinActions = useActivityJoinActions({
    activity: input.selected?.activity ?? null,
    uiState: joinUiState,
    requestIdFallback: joinContext?.myRequest?.id ?? null,
    joinGuardMessage,
    onReload: reloadJoinContext,
    onMessage: input.setExploreNotice,
    onError: input.setExploreNotice,
  });

  const handlePeekJoinSuccess = useCallback(
    (message: string) => {
      joinActions.handleJoinSuccess(message);
    },
    [joinActions]
  );

  const messageHost = useCallback(
    (item: ExploreMapItemDTO) => {
      const requesterId = item.featuredPerson?.userId ?? item.activity?.hostUserId;
      if (!requesterId) return;
      if (!input.user) {
        joinActions.openGuestBrowseGate('peek-details', 'message_host');
        return;
      }
      const returnTo = input.selectedId
        ? buildMapPeekReturnPath(input.selectedId, input.location)
        : undefined;
      input.setSelectedId(null);
      navigateToMessagesWithReturn(
        input.navigate,
        messagesRouteForRole((input.user.role ?? 'participant') as UserRole, requesterId),
        returnTo
      );
    },
    [input, joinActions]
  );

  const handleGuestGatedAction = useCallback(
    (pendingAction: ActivityMapPeekActionId = 'view_detail') => {
      if (input.user) return;
      if (pendingAction === 'view_detail' && guestExplorePreviewLimitReached()) {
        joinActions.openGuestBrowseGate('preview-limit', pendingAction);
        return;
      }
      joinActions.openGuestBrowseGate('peek-details', pendingAction);
    },
    [input.user, joinActions]
  );

  const handleJoin = useCallback(() => {
    const selected = input.selected;
    if (!selected?.activity?.id) return;
    if (!input.user) {
      joinActions.openGuestSheet('activity');
      return;
    }
    applyPeekJoinOpenAfterClick(joinUiState, joinStateLoading, {
      openJoinModal: () => joinActions.openJoinModal(),
      setShowWithdraw: (open) => joinActions.setShowWithdraw(open),
    });
  }, [input.selected, input.user, joinUiState, joinStateLoading, joinActions]);

  const handlePeekHostMessage = useCallback(() => {
    if (input.selected) messageHost(input.selected);
  }, [input.selected, messageHost]);

  return {
    joinUiState,
    joinStateLoading,
    peekJoinUiState,
    peekJoinStateLoading,
    joinActions,
    handlePeekJoinSuccess,
    activityPeekSkipsJoinContext,
    handleGuestGatedAction,
    handleJoin,
    handlePeekHostMessage,
    messageHost,
  };
};
