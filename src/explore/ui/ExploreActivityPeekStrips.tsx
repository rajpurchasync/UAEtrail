import { Car, Users } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import {
  ACTIVITY_PEEK_SECTION_BUDDIES,
  ACTIVITY_PEEK_SECTION_LOGISTICS,
  activityPeekPendingInviteChipLabel,
} from '../../content/activityPeekCopy';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../createFlowCopy';
import { resolveActivityMapPeekStrips } from '../../activity/activityPeekEngagement';
import { ExploreLinkedRidesharePeekIndication } from './ExploreLinkedRidesharePeekIndication';
import { ExploreCardCapacityRow, ExploreCardPeopleRow } from './ExploreCardPresentation';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';

const stripShell = 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel = 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

type ExploreActivityPeekStripsProps = {
  card: ExploreCardModel;
  joinUiState?: JoinRequestUiState;
  onGuestGatedAction?: () => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
};

/** Activity map peek — people + logistics strips (facts stay in peek hero/meta). */
export const ExploreActivityPeekStrips = ({
  card,
  joinUiState,
  onGuestGatedAction,
  onOpenExploreItem,
  onOfferTransport,
}: ExploreActivityPeekStripsProps) => {
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const showOfferTransport = Boolean(onOfferTransport) && strips.showOfferRideInLogistics;

  return (
  <div className="space-y-2">
    {strips.showParticipantsStrip ? (
    <section className={stripShell} aria-label={ACTIVITY_PEEK_SECTION_BUDDIES}>
      <div className={stripLabel}>
        <Users className="h-3.5 w-3.5" aria-hidden />
        {ACTIVITY_PEEK_SECTION_BUDDIES}
      </div>
      <ExploreCardPeopleRow card={card} onGuestGatedAction={onGuestGatedAction} />
      {strips.pendingJoinInviteCount > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900">
            {activityPeekPendingInviteChipLabel(strips.pendingJoinInviteCount)}
          </span>
        </div>
      ) : null}
    </section>
    ) : null}
    {strips.showLogisticsStrip ? (
    <section className={stripShell} aria-label={ACTIVITY_PEEK_SECTION_LOGISTICS}>
      <div className={stripLabel}>
        <Car className="h-3.5 w-3.5" aria-hidden />
        {ACTIVITY_PEEK_SECTION_LOGISTICS}
      </div>
      <ExploreLinkedRidesharePeekIndication card={card} onOpenExploreItem={onOpenExploreItem} />
      {showOfferTransport ? (
        <button
          type="button"
          onClick={onGuestGatedAction ?? onOfferTransport}
          className="mt-3 w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-900 active:bg-sky-50"
        >
          {ORGANIZE_LINK_RIDESHARE_LABEL}
        </button>
      ) : null}
      <ExploreCardCapacityRow card={card} />
    </section>
    ) : null}
  </div>
  );
};
