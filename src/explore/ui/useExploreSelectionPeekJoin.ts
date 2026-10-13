import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { exploreMapItemIsSeeking, type ExploreMapItemDTO, type UserRole } from '@uaetrail/shared-types';
import {
  activityMapPeekNeedsJoinContext,
  activityMapPeekSkipsJoinContext,
} from '../../activity/activityPeekEngagement';
import type { DiscoveryCardViewModel } from '../../discovery';
import {
  createParticipantIntentJoinRequest,
} from '../../hooks/participantIntentClientApi';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useParticipantIntentJoinContext } from '../../hooks/useParticipantIntentJoinContext';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { messagesRouteForRole } from '../../utils/authRouting';

/** Join / demand-join context for map peek selection (C18). */
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

  const seekingUsesLegacyIntentJoin = Boolean(
    input.selected &&
      exploreMapItemIsSeeking(input.selected) &&
      input.selected.participantIntentId &&
      !input.selected.activity?.id
  );
  const demandJoinContextEnabled = Boolean(
    seekingUsesLegacyIntentJoin && !input.selectedCard?.showDemandOwnerActions && input.user
  );
  const {
    uiState: demandJoinUiState,
    loading: demandJoinStateLoading,
    reload: reloadDemandJoinContext,
  } = useParticipantIntentJoinContext({
    intentId: input.selected?.participantIntentId,
    enabled: demandJoinContextEnabled,
    userId: input.user?.id,
  });

  const activityPeekSkipsJoinContext = useMemo(
    () =>
      Boolean(
        input.selectedCard && activityMapPeekSkipsJoinContext(input.selectedCard, joinUiState)
      ),
    [input.selectedCard, joinUiState]
  );

  const peekJoinUiState = demandJoinContextEnabled
    ? demandJoinUiState
    : activityPeekSkipsJoinContext
      ? undefined
      : joinUiState;
  const peekJoinStateLoading = demandJoinContextEnabled ? demandJoinStateLoading : joinStateLoading;

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

  const respondToDemand = useCallback(
    (item: ExploreMapItemDTO) => {
      const requesterId = item.requesterUserId;
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
    const intent =
      input.selected?.source === 'venue' || input.selected?.source === 'shop' ? 'place' : 'activity';
    joinActions.openGuestSheet(intent);
  }, [input.user, input.selected?.source, joinActions]);

  const handleJoin = useCallback(() => {
    const selected = input.selected;
    if (selected && exploreMapItemIsSeeking(selected)) {
      if (!input.user) {
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
          input.setDemandNotice('Request sent — they’ll review your request.');
        } catch (err) {
          input.setDemandNotice(err instanceof Error ? err.message : 'Could not send your request.');
        }
      })();
      return;
    }
    if (!selected?.activity) return;
    if (!input.user) {
      joinActions.openGuestSheet('activity');
      return;
    }
    if (joinUiState.kind !== 'open') return;
    joinActions.openJoinModal();
  }, [
    input.selected,
    input.user,
    joinUiState.kind,
    demandJoinUiState.kind,
    joinActions,
    reloadDemandJoinContext,
    input.setDemandNotice,
  ]);

  const handleDemandMessage = useCallback(() => {
    if (input.selected) respondToDemand(input.selected);
  }, [input.selected, respondToDemand]);

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
    handleDemandMessage,
    respondToDemand,
  };
};
