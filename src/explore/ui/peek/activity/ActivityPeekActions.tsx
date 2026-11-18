import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { discoveryCardUsesActivityPeekEngagement } from '../../../../discovery/discoveryCardModel';
import {
  activityPeekHasMapWireActions,
  resolveActivityPeekEngagement,
} from '../../../../activity/activityPeekEngagement';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { useLocation } from 'react-router-dom';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { ActivityPeekStandardFooter } from './ActivityPeekStandardFooter';

export type ActivityPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  mapPeekCompact?: boolean;
};

const PeekLoading = () => (
  <div className="flex justify-center py-3">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
  </div>
);

/** Hosted + seeking activity map peek. States match the activity detail footer. */
export const ActivityPeekActions = ({
  card,
  onClose,
  onJoin,
  onWithdraw,
  onActivityMapPeekAction,
  joinUiState,
  joinStateLoading = false,
  onGuestGatedAction,
  mapPeekCompact = true,
}: ActivityPeekActionsProps) => {
  const location = useLocation();
  const gate = onGuestGatedAction;
  const effectiveJoinStateLoading = activityPeekHasMapWireActions(card) ? false : joinStateLoading;
  const peekDetailNavState = mapPeekDetailNavState(location);

  if (!discoveryCardUsesActivityPeekEngagement(card)) {
    return (
      <PeekDetailLink
        card={card}
        label={card.secondaryCta ?? 'View details'}
        className="block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900"
        onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
        onBeforeNavigate={onClose}
        linkState={peekDetailNavState}
      />
    );
  }

  const engagement = resolveActivityPeekEngagement(card, joinUiState);

  if (
    engagement.showsFallbackJoinFlow &&
    joinStateLoading &&
    !activityPeekHasMapWireActions(card) &&
    !joinUiState
  ) {
    return <PeekLoading />;
  }

  if (!onActivityMapPeekAction) {
    return (
      <PeekDetailLink
        card={card}
        label={card.secondaryCta ?? 'View details'}
        className="block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900"
        onGuestGatedAction={gate ? () => gate('view_detail') : undefined}
        onBeforeNavigate={onClose}
        linkState={peekDetailNavState}
      />
    );
  }

  return (
    <ActivityPeekStandardFooter
      card={card}
      joinUiState={joinUiState ?? { kind: 'open' }}
      joinStateLoading={effectiveJoinStateLoading}
      onAction={onActivityMapPeekAction}
      onJoin={onJoin}
      onWithdraw={onWithdraw}
      onGuestGatedAction={gate}
      onBeforeDetailNavigate={onClose}
      mapDualFooter={mapPeekCompact}
    />
  );
};
