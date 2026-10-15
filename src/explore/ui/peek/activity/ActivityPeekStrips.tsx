import { Users } from 'lucide-react';
import { exploreCardActivityShowsPeekSpots, type ExploreCardModel } from '../../../exploreCardModel';
import { exploreActivityPublisherSectionNoun } from '@uaetrail/shared-types';
import { activityPeekPendingInviteChipLabel } from '../../../content/activityPeekCopy';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../../createFlowCopy';
import { resolveActivityMapPeekStrips } from '../../../activity/activityPeekEngagement';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from './ActivityPeekLinkedTransport';
import {
  ExploreActivityPeekSpotsSection,
  ExploreCardPeopleRow,
} from '../ExploreCardPresentation';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';

const stripShell = 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel = 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

export type ActivityPeekStripsProps = {
  card: ExploreCardModel;
  joinUiState?: JoinRequestUiState;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (pinItemId: string) => void;
  onOfferTransport?: () => void;
};

/** Activity pin summary — spots, host, transport / linked rideshare (L1 strip flags). */
export const ActivityPeekStrips = ({
  card,
  joinUiState,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
}: ActivityPeekStripsProps) => {
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const showOfferTransport = Boolean(onOfferTransport) && strips.showOfferRideInLogistics;
  const hasRideshareAffordance = activityPeekHasLinkedTransportAffordance(card);
  const showTransportSection =
    strips.showLogisticsStrip && (hasRideshareAffordance || showOfferTransport);
  const publisherSectionLabel = exploreActivityPublisherSectionNoun(
    card.activity?.publishingProfileKind
  );
  const showSpotsSection = strips.showLogisticsStrip && exploreCardActivityShowsPeekSpots(card);

  return (
    <div className="space-y-2">
      {showSpotsSection ? <ExploreActivityPeekSpotsSection card={card} /> : null}
      {strips.showParticipantsStrip ? (
        <section className={stripShell} aria-label={publisherSectionLabel}>
          <div className={stripLabel}>
            <Users className="h-3.5 w-3.5" aria-hidden />
            {publisherSectionLabel}
          </div>
          <ExploreCardPeopleRow
            card={card}
            onGuestGatedAction={onGuestGatedAction}
            hideProMembershipUpsell
            compactSection
          />
          {strips.pendingJoinInviteCount > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900">
                {activityPeekPendingInviteChipLabel(strips.pendingJoinInviteCount)}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}
      {showTransportSection ? (
        <section className={stripShell} aria-label="Transport">
          <ActivityPeekLinkedTransport card={card} onOpenLinkedPin={onOpenLinkedPin} />
          {showOfferTransport ? (
            <button
              type="button"
              onClick={onGuestGatedAction ?? onOfferTransport}
              className="mt-3 w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-900 active:bg-sky-50"
            >
              {ORGANIZE_LINK_RIDESHARE_LABEL}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
