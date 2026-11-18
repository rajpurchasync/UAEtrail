import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { SecureAvatar } from '../../../../components/ui/SecureAvatar';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
} from '../../../../discovery/discoveryCardModel';
import {
  resolveDiscoveryHostedByPublisher,
  resolveDiscoveryHostTrustLabels,
} from '../../../../discovery/discoveryHostTrustPresentation';
import { resolveActivityMapPeekScheduleLine } from '../../../../activity/resolveActivityMapPeekScheduleLine';

/** Reference trip peek — host avatar is the attention anchor; schedule adds urgency. */
export const ActivityMapPeekHostBand = ({
  card,
  onGuestGatedAction,
  onBeforeNavigate,
}: {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
}) => {
  const publisher = resolveDiscoveryHostedByPublisher(card);
  const hostName = publisher.name?.trim();
  if (!hostName) return null;

  const hostAvatar = publisher.avatarUrl ?? card.hostAvatar;
  const trustLabels = resolveDiscoveryHostTrustLabels(card);
  const scheduleLine = resolveActivityMapPeekScheduleLine(card);
  const isGuest = Boolean(onGuestGatedAction);
  const hostProfilePath = resolveDiscoveryCardHostProfilePath(card);
  const canOpen = discoveryCardCanOpenHostProfile(card, { isGuest });
  const hostPath = hostProfilePath && canOpen && !isGuest ? hostProfilePath : null;

  const inner = (
    <>
      <SecureAvatar
        src={hostAvatar}
        name={hostName}
        className="h-10 w-10 shrink-0 text-sm shadow-sm ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate ${EXPLORE_PEEK.tripHostName}`}>{hostName}</p>
        {trustLabels[0] ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-emerald-800">{trustLabels[0]}</p>
        ) : null}
        {scheduleLine ? (
          <p className={`mt-1 flex items-center gap-1 ${EXPLORE_PEEK.tripSchedule}`}>
            <Clock className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
            <span className="truncate">{scheduleLine}</span>
          </p>
        ) : null}
      </div>
    </>
  );

  if (hostPath) {
    return (
      <Link
        to={hostPath}
        onClick={() => onBeforeNavigate?.()}
        className="flex min-w-0 items-start gap-2.5 rounded-xl py-0.5 transition-colors hover:bg-neutral-50/80"
        data-activity-map-peek-host
      >
        {inner}
      </Link>
    );
  }

  if (hostProfilePath && isGuest) {
    return (
      <button
        type="button"
        onClick={onGuestGatedAction}
        className="flex w-full min-w-0 items-start gap-2.5 rounded-xl py-0.5 text-left hover:bg-neutral-50/80"
        data-activity-map-peek-host
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 items-start gap-2.5" data-activity-map-peek-host>
      {inner}
    </div>
  );
};