import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { resolveActivityMapPeekStrips } from '../../../activity/activityPeekEngagement';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { ActivityPeekStrips } from './ActivityPeekStrips';

export type ActivityPeekBodyProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinUiState?: JoinRequestUiState;
};

/** Hosted / seeking activity pin body (strips + joined chip). */
export const ActivityPeekBody = ({
  card,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
  joinUiState,
}: ActivityPeekBodyProps) => {
  const showJoinedChip = resolveActivityMapPeekStrips(card, joinUiState).showJoinedStatusChipOnPeek;
  return (
    <>
      {showJoinedChip ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
            Joined
          </span>
        </div>
      ) : null}
      <ActivityPeekStrips
        card={card}
        joinUiState={joinUiState}
        onGuestGatedAction={onGuestGatedAction}
        onOpenLinkedPin={onOpenLinkedPin}
        onOfferTransport={onOfferTransport}
      />
    </>
  );
};
