import { Users } from 'lucide-react';
import { discoveryCardActivityShowsPeekSpots, type DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { exploreActivityPublisherSectionNoun } from '@uaetrail/shared-types';
import { activityPeekPendingInviteChipLabel } from '../../../../content/activityPeekCopy';
import { HOSTING_LINK_RIDESHARE_LABEL } from '../../../createFlowCopy';
import { resolveActivityMapPeekStrips } from '../../../../activity/activityPeekEngagement';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from './ActivityPeekLinkedTransport';
import {
  ExploreActivityPeekSpotsSection,
  DiscoveryCardPeopleRow,
} from '../../DiscoveryCardPresentation';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';

const stripShell = (compact: boolean) =>
  compact
    ? 'rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5'
    : 'mt-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel = (compact: boolean) =>
  compact
    ? 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500'
    : 'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

export type ActivityPeekStripsProps = {
  card: DiscoveryCardModel;
  joinUiState?: JoinRequestUiState;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (pinItemId: string) => void;
  onOfferTransport?: () => void;
  /** Detail fold renders dedicated host + participants blocks above requirements. */
  hideParticipantsStrip?: boolean;
  mapPeekCompact?: boolean;
};

/** Activity pin summary — spots, host, transport / linked rideshare (L1 strip flags). */
export const ActivityPeekStrips = ({
  card,
  joinUiState,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
  hideParticipantsStrip = false,
  mapPeekCompact = false,
}: ActivityPeekStripsProps) => {
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const showOfferTransport = Boolean(onOfferTransport) && strips.showOfferRideInLogistics;
  const hasRideshareAffordance = activityPeekHasLinkedTransportAffordance(card);
  const showTransportSection =
    !mapPeekCompact &&
    strips.showLogisticsStrip &&
    (hasRideshareAffordance || showOfferTransport);
  const publisherSectionLabel = exploreActivityPublisherSectionNoun(
    card.activity?.publishingProfileKind
  );
  const showSpotsSection = strips.showLogisticsStrip && discoveryCardActivityShowsPeekSpots(card);

  return (
    <div className={mapPeekCompact ? 'space-y-3' : 'space-y-2'}>
      {showSpotsSection ? (
        <ExploreActivityPeekSpotsSection card={card} compact={mapPeekCompact} />
      ) : null}
      {strips.showParticipantsStrip && !hideParticipantsStrip && !mapPeekCompact ? (
        <section className={stripShell(mapPeekCompact)} aria-label={publisherSectionLabel}>
          <div className={stripLabel(mapPeekCompact)}>
            <Users className={mapPeekCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
            {publisherSectionLabel}
          </div>
          <DiscoveryCardPeopleRow
            card={card}
            onGuestGatedAction={onGuestGatedAction}
            hideProMembershipUpsell
            compactSection
            mapPeekCompact={mapPeekCompact}
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
        <section className={stripShell(false)} aria-label="Transport">
          <ActivityPeekLinkedTransport card={card} onOpenLinkedPin={onOpenLinkedPin} />
          {showOfferTransport ? (
            <button
              type="button"
              onClick={onGuestGatedAction ?? onOfferTransport}
              className="mt-3 w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-900 active:bg-sky-50"
            >
              {HOSTING_LINK_RIDESHARE_LABEL}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
