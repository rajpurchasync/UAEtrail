import { useEffect, useMemo, useState } from 'react';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import { resolveActivityMapPeekActions } from '../../../activity/activityPeekEngagement';
import { executeActivityMapPeekAction } from '../../../activity/executeActivityMapPeekAction';
import type { ActivityMapPeekActionHandlers } from '../../../activity/executeActivityMapPeekAction';
import { ActivityPeekEngagementActions } from '../../../explore/ui/peek/activity/ActivityPeekEngagementActions';
import { ActivityParticipationManageSheet } from '../ActivityParticipationManageSheet';
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
  showHostManageHub: boolean;
};

type Model = ActivityDetailEngagementModel;

type ActivityDetailEngagementActionsProps = {
  model: Model;
  handlers: ActivityMapPeekActionHandlers;
  linkRideshareTenantId?: string | null;
  onParticipantInviteFriends?: () => void;
  onWithdraw?: () => void;
  /** Wire `manage_activity` on consumer layout (no Buddies tab). */
  registerParticipationManageOpener?: (open: () => void) => void;
};

/** Wire peek parity CTAs on activity detail (policy-driven, same ids as map peek). */
export const ActivityDetailEngagementActions = ({
  model,
  handlers,
  linkRideshareTenantId = null,
  onParticipantInviteFriends,
  onWithdraw,
  registerParticipationManageOpener,
}: ActivityDetailEngagementActionsProps) => {
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    registerParticipationManageOpener?.(() => setManageOpen(true));
  }, [registerParticipationManageOpener]);

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
    !model.showHostManageHub &&
    (model.joinUiState.kind === 'pending' || model.joinUiState.kind === 'confirmed');

  if (actions.length === 0 && !showParticipationManage) return null;

  const onAction = (actionId: ActivityMapPeekActionId) => {
    executeActivityMapPeekAction(actionId, handlers);
  };

  const inviteFromManage = () => {
    onParticipantInviteFriends?.();
    handlers.inviteCrew?.();
  };

  return (
    <>
      <ActivityPeekEngagementActions
        card={card}
        actions={actions}
        linkRideshareTenantId={linkRideshareTenantId}
        onAction={onAction}
        joinUiState={model.joinUiState}
        surface="detail"
        onOpenParticipationManage={
          showParticipationManage && onWithdraw ? () => setManageOpen(true) : undefined
        }
      />
      {showParticipationManage && onWithdraw ? (
        <ActivityParticipationManageSheet
          open={manageOpen}
          joinUiState={model.joinUiState}
          onClose={() => setManageOpen(false)}
          onInviteFriends={inviteFromManage}
          onWithdraw={onWithdraw}
        />
      ) : null}
    </>
  );
};
