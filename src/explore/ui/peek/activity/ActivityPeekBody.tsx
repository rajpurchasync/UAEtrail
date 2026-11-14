import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { resolveActivityMapPeekStrips } from '../../../../activity/activityPeekEngagement';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import {
  ACTIVITY_PEEK_MANAGE_LABEL,
  ACTIVITY_STATUS_JOINED,
} from '../../../../content/activityParticipationCopy';
import { resolveActivityPeekStatusChips } from '../../../../activity/resolveActivityPeekStatusChips';
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
  const statusChips = resolveActivityPeekStatusChips(card, joinUiState);
  const chips =
    strips.showJoinedStatusChipOnPeek && !statusChips.some((chip) => chip.tone === 'joined')
      ? [...statusChips, { label: ACTIVITY_STATUS_JOINED, tone: 'joined' as const }]
      : statusChips;
  const activityId = card.activityId ?? card.activity?.id;
  const manageHref = activityId ? activityDetailPath(activityId) : undefined;

  const chipClass = (tone: 'joined' | 'pending' | 'waitlist') => {
    if (tone === 'joined') {
      return 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900';
    }
    if (tone === 'waitlist') {
      return 'inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900';
    }
    return 'inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900';
  };

  const statusChipRow =
    chips.length > 0 ? (
      <div className={`flex flex-wrap items-center gap-2 ${mapPeekCompact ? 'mt-0' : 'mt-2'}`}>
        {chips.map((chip) => (
          <span key={`${chip.tone}-${chip.label}`} className={chipClass(chip.tone)}>
            {chip.label}
          </span>
        ))}
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
