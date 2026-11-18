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

/** Host anchor — avatar, name, activity kind, trust (schedule/place live under title). */
export const ActivityMapPeekHostLead = ({
  card,
  kindLabel,
  onGuestGatedAction,
  onBeforeNavigate,
}: {
  card: DiscoveryCardModel;
  kindLabel: string | null;
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
}) => {
  const publisher = resolveDiscoveryHostedByPublisher(card);
  const hostName = publisher.name?.trim();
  if (!hostName) return null;

  const hostAvatar = publisher.avatarUrl ?? card.hostAvatar;
  const trustLabels = resolveDiscoveryHostTrustLabels(card);
  const isGuest = Boolean(onGuestGatedAction);
  const hostProfilePath = resolveDiscoveryCardHostProfilePath(card);
  const canOpen = discoveryCardCanOpenHostProfile(card, { isGuest });
  const hostPath = hostProfilePath && canOpen && !isGuest ? hostProfilePath : null;

  const inner = (
    <div className="flex min-w-0 items-start gap-3 pr-10">
      <SecureAvatar
        src={hostAvatar}
        name={hostName}
        className="h-12 w-12 shrink-0 text-sm shadow-md ring-2 ring-white"
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <p className={`truncate ${EXPLORE_PEEK.tripHostName}`}>{hostName}</p>
          {kindLabel ? (
            <span className="text-[11px] font-medium text-neutral-500">· {kindLabel}</span>
          ) : null}
        </div>
        {trustLabels[0] ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-emerald-800">{trustLabels[0]}</p>
        ) : null}
      </div>
    </div>
  );

  const shellClass = 'block min-w-0';

  if (hostPath) {
    return (
      <Link to={hostPath} onClick={() => onBeforeNavigate?.()} className={`${shellClass} hover:opacity-95`}>
        {inner}
      </Link>
    );
  }

  if (hostProfilePath && isGuest) {
    return (
      <button type="button" onClick={onGuestGatedAction} className={`${shellClass} w-full text-left`}>
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
};