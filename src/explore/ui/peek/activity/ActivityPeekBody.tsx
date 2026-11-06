import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { resolveActivityMapPeekStrips } from '../../../../activity/activityPeekEngagement';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import {
  ACTIVITY_PEEK_MANAGE_LABEL,
  ACTIVITY_STATUS_JOIN_REQUESTED,
  ACTIVITY_STATUS_JOINED,
} from '../../../../content/activityParticipationCopy';
import { activityPeekViewerIsJoined } from '../../../../activity/activityPeekEngagement';
import { activityDetailPath } from '../../../../config/routingCatalog';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { useLocation } from 'react-router-dom';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { ActivityPeekStrips } from './ActivityPeekStrips';

export type ActivityPeekBodyProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinUiState?: JoinRequestUiState;
  mapPeekCompact?: boolean;
};

/** Hosted / seeking activity pin body (strips + joined chip). */
export const ActivityPeekBody = ({
  card,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
  joinUiState,
  mapPeekCompact = false,
}: ActivityPeekBodyProps) => {
  const location = useLocation();
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const showJoinedChip =
    strips.showJoinedStatusChipOnPeek || activityPeekViewerIsJoined(card, joinUiState);
  const showJoinRequestedChip = joinUiState?.kind === 'pending';
  const activityId = card.activityId ?? card.activity?.id;
  const manageHref = activityId ? activityDetailPath(activityId) : undefined;

  const statusChipRow =
    showJoinedChip || showJoinRequestedChip ? (
      <div className={`flex flex-wrap items-center gap-2 ${mapPeekCompact ? 'mt-0' : 'mt-2'}`}>
        {showJoinRequestedChip ? (
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            {joinUiState.status === 'waitlisted' ? 'On waitlist' : ACTIVITY_STATUS_JOIN_REQUESTED}
          </span>
        ) : null}
        {showJoinedChip ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
            {ACTIVITY_STATUS_JOINED}
          </span>
        ) : null}
        {manageHref ? (
          <PeekDetailLink
            card={card}
            label={ACTIVITY_PEEK_MANAGE_LABEL}
            className="text-xs font-semibold text-emerald-800 underline underline-offset-2"
            hrefOverride={manageHref}
            onGuestGatedAction={onGuestGatedAction}
            linkState={mapPeekDetailNavState(location)}
          />
        ) : null}
      </div>
    ) : null;

  return (
    <>
      {statusChipRow}
      <div className={mapPeekCompact ? 'mt-2.5' : 'mt-3'}>
      <ActivityPeekStrips
        card={card}
        joinUiState={joinUiState}
        onGuestGatedAction={onGuestGatedAction}
        onOpenLinkedPin={onOpenLinkedPin}
        onOfferTransport={onOfferTransport}
        mapPeekCompact={mapPeekCompact}
      />
      </div>
    </>
  );
};
