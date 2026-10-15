import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ExploreMapItemDTO, UserRole } from '@uaetrail/shared-types';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekSkipsJoinContext,
} from '../../activity/activityPeekEngagement';
import type { DiscoveryCardViewModel } from '../../discovery';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { messagesRouteForRole } from '../../utils/authRouting';

/** Join context for map peek — activity wire only (hosted + seeking). */
export const useExploreSelectionPeekJoin = (input: {
  selected: ExploreMapItemDTO | null;
  selectedCard: DiscoveryCardViewModel | null;
  user: { id: string; role?: string } | null | undefined;
  setDemandNotice: (message: string | null) => void;
  setSelectedId: (id: string | null) => void;
  navigate: NavigateFunction;
}) => {
  const viewerGender = useViewerProfileGender(input.user?.id);
  const joinGuardMessage = useMemo(
    () => womenOnlyJoinMessageForActivity(input.selected?.activity?.requirements, viewerGender),
    [input.selected?.activity?.requirements, viewerGender]
  );

  const joinContextEnabled = Boolean(
    input.selected?.activity?.id &&
      input.user &&
      input.selectedCard &&
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

  const peekJoinUiState = activityPeekSkipsJoinContext ? undefined : joinUiState;
  const peekJoinStateLoading = joinStateLoading;

  const joinActions = useActivityJoinActions({
    activity: input.selected?.activity ?? null,
    uiState: joinUiState,
    requestIdFallback: joinContext?.myRequest?.id ?? null,
    joinGuardMessage,
    onReload: reloadJoinContext,
    onMessage: input.setDemandNotice,
    onError: input.setDemandNotice,
  });

  const handlePeekJoinSuccess = useCallback(
    (message: string) => {
      joinActions.handleJoinSuccess(message);
    },
    [joinActions]
  );

  const messageOrganizer = useCallback(
    (item: ExploreMapItemDTO) => {
      const requesterId = item.requesterUserId ?? item.activity?.hostUserId;
      if (!requesterId) return;
      if (!input.user) {
        joinActions.openGuestSheet('activity');
        return;
      }
      input.navigate(
        messagesRouteForRole((input.user.role ?? 'participant') as UserRole, requesterId)
      );
      input.setSelectedId(null);
    },
    [input.user, input.navigate, joinActions, input.setSelectedId]
  );

  const handleGuestGatedAction = useCallback(() => {
    if (input.user) return;
    joinActions.openGuestBrowseGate('peek-details');
  }, [input.user, joinActions]);

  const handleJoin = useCallback(() => {
    const selected = input.selected;
    if (!selected?.activity?.id) return;
    if (!input.user) {
      joinActions.openGuestSheet('activity');
      return;
    }
    if (joinUiState.kind !== 'open') return;
    joinActions.openJoinModal();
  }, [input.selected, input.user, joinUiState.kind, joinActions]);

  const handlePeekOrganizerMessage = useCallback(() => {
    if (input.selected) messageOrganizer(input.selected);
  }, [input.selected, messageOrganizer]);

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
    handlePeekOrganizerMessage,
    messageOrganizer,
  };
};
