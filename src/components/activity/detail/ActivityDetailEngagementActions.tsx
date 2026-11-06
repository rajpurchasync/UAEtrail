import { useMemo } from 'react';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import { resolveActivityMapPeekActions } from '../../../activity/activityPeekEngagement';
import { executeActivityMapPeekAction } from '../../../activity/executeActivityMapPeekAction';
import type { ActivityMapPeekActionHandlers } from '../../../activity/executeActivityMapPeekAction';
import { discoveryCardActivityJoinIsFull } from '../../../discovery/discoveryCardModel';
import { ActivityDetailStandardFooter } from './ActivityDetailStandardFooter.tsx';
import {
  resolveActivityDetailStandardFooter,
  type ActivityDetailFooterAction,
} from './activityDetailFooterSlots';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';

export type ActivityDetailEngagementModel = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips: ActivityEngagementStripsDTO | null;
  joinUiState: JoinRequestUiState;
};

type Model = ActivityDetailEngagementModel;

type ActivityDetailEngagementActionsProps = {
  model: Model;
  handlers: ActivityMapPeekActionHandlers;
  linkRideshareTenantId?: string | null;
  onParticipantInviteFriends?: () => void;
  onWithdraw?: () => void;
  /** Same as host manage sheet gate — not wire `viewerAccess.level` alone. */
  isHostUser?: boolean;
};

/** Wire peek parity CTAs on activity detail (policy-driven, same ids as map peek). */
export const ActivityDetailEngagementActions = ({
  model,
  handlers,
  onParticipantInviteFriends,
  onWithdraw,
  isHostUser = false,
}: ActivityDetailEngagementActionsProps) => {
  const card = useMemo(
    () =>
      buildActivityDetailPageShellCard({
        activity: model.activity,
        viewerAccess: model.viewerAccess,
        wireStrips: model.wireStrips,
      }),
    [model.activity, model.viewerAccess, model.wireStrips]
  );

  const actions = useMemo(() => {
    const wire = resolveActivityMapPeekActions(card, model.joinUiState);
    return wire.filter((action) => action.id !== 'view_detail');
  }, [card, model.joinUiState]);

  const showParticipationManage =
    Boolean(onWithdraw) &&
    (model.joinUiState.kind === 'pending' || model.joinUiState.kind === 'confirmed');
  const canManageParticipation = showParticipationManage;
  const pendingWire = actions.find((action) => action.id === 'pending_join');

  const footer = resolveActivityDetailStandardFooter({
    isHost: isHostUser,
    joinUiState: model.joinUiState,
    viewerLevel: card.viewerAccess?.level ?? null,
    wirePending: Boolean(pendingWire),
    pendingStatus: pendingWire?.joinRequestStatus ?? null,
    joinFull: discoveryCardActivityJoinIsFull(card),
    joinLabel: card.primaryCta,
    canManageParticipation,
  });

  const onAction = (actionId: ActivityMapPeekActionId) => {
    executeActivityMapPeekAction(actionId, handlers);
  };

  const onFooterPress = (action: ActivityDetailFooterAction) => {
    switch (action) {
      case 'request_join':
        onAction('request_join');
        return;
      case 'message_host':
        onAction('message_host');
        return;
      case 'open_crew_chat':
        onAction('open_crew_chat');
        return;
      case 'invite_crew':
        onAction('invite_crew');
        return;
      case 'participant_invite':
        onParticipantInviteFriends?.();
        return;
      case 'participant_withdraw':
        onWithdraw?.();
        return;
      case 'share_activity':
        onAction('share_activity');
        return;
      case 'host_manage':
        onAction('manage_activity');
        return;
      case 'open_pending_manage':
      case 'open_participation_manage':
        return;
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  };

  return (
    <ActivityDetailStandardFooter
      mode={footer.mode}
      left={footer.left}
      center={footer.center}
      right={footer.right}
      onPress={onFooterPress}
    />
  );
};
