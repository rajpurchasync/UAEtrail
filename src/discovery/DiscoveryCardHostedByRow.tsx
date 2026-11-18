import { ChevronRight, Clock } from 'lucide-react';
import { resolveActivityMapPeekScheduleLine } from '../activity/resolveActivityMapPeekScheduleLine';
import { Link } from 'react-router-dom';
import { HOSTED_BY_LABEL } from '../content/workspaceVocabulary';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { EXPLORE_TYPE } from '../config/exploreTheme';
import type { DiscoveryCardModel } from './discoveryCardModel';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
} from './discoveryCardModel';
import {
  resolveDiscoveryHostedByPublisher,
  resolveDiscoveryHostTrustLabels,
} from './discoveryHostTrustPresentation';
import { DiscoveryCardHostProfileNav } from './DiscoveryCardHostProfileNav';

type DiscoveryCardHostedByRowProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
  /** List thumb — host chip inside item link. */
  embedInItemLink?: boolean;
  mapPeekCompact?: boolean;
  /** Map trip peek — schedule under name; no tour-operator kicker. */
  tripMapPeek?: boolean;
  className?: string;
};

/** Hosted-by block — label, person, trust chips (peek + browse list). */
export const DiscoveryCardHostedByRow = ({
  card,
  onGuestGatedAction,
  onBeforeNavigate,
  embedInItemLink = false,
  mapPeekCompact = false,
  tripMapPeek = false,
  className = '',
}: DiscoveryCardHostedByRowProps) => {
  const scheduleLine = tripMapPeek ? resolveActivityMapPeekScheduleLine(card) : null;
  const publisher = resolveDiscoveryHostedByPublisher(card);
  const hostName = publisher.name?.trim();
  if (!hostName) return null;

  const hostAvatar = publisher.avatarUrl ?? card.hostAvatar;
  const trustLabels = resolveDiscoveryHostTrustLabels(card);
  const isGuest = Boolean(onGuestGatedAction);
  const hostProfilePath = resolveDiscoveryCardHostProfilePath(card);
  const canOpen = discoveryCardCanOpenHostProfile(card, { isGuest });
  const hostPath = hostProfilePath && canOpen && !isGuest ? hostProfilePath : null;

  const avatarClass = mapPeekCompact
    ? 'h-8 w-8 shrink-0 text-[10px] ring-2 ring-white'
    : embedInItemLink
      ? 'mt-0.5 h-5 w-5 shrink-0 text-[8px] ring-1 ring-white'
      : 'h-10 w-10 shrink-0 text-sm ring-2 ring-white';

  const labelClass = mapPeekCompact
    ? `text-[10px] font-medium uppercase tracking-wide ${EXPLORE_TYPE.muted}`
    : embedInItemLink
      ? 'text-[10px] font-semibold uppercase tracking-wide text-neutral-500'
      : `text-xs font-medium uppercase tracking-wide ${EXPLORE_TYPE.muted}`;

  const nameClass = mapPeekCompact
    ? 'truncate text-xs font-semibold text-gray-900'
    : embedInItemLink
      ? 'block min-w-0 truncate text-[12px] font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-2'
      : 'truncate text-sm font-semibold text-gray-900 group-hover:text-emerald-800';

  const shellClass = `flex min-w-0 items-start gap-2.5 ${className}`;

  const inner = (
    <>
      <SecureAvatar src={hostAvatar} name={hostName} className={avatarClass} />
      <div className="min-w-0 flex-1">
        {!tripMapPeek ? (
          <p className={labelClass}>
            {publisher.kind === 'company' ? 'Tour operator' : HOSTED_BY_LABEL}
          </p>
        ) : null}
        <p className={nameClass}>{hostName}</p>
        {scheduleLine ? (
          <p
            className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium leading-snug ${EXPLORE_TYPE.muted}`}
          >
            <Clock className="h-3 w-3 shrink-0 text-rose-500" aria-hidden />
            <span className="truncate">{scheduleLine}</span>
          </p>
        ) : null}
        {trustLabels.length > 0 && !tripMapPeek ? (
          <p
            className={
              mapPeekCompact
                ? 'mt-0.5 text-[10px] font-medium leading-snug text-emerald-800'
                : 'mt-0.5 text-[11px] font-medium leading-snug text-emerald-800'
            }
          >
            {trustLabels.join(' · ')}
          </p>
        ) : null}
      </div>
      {hostPath && !embedInItemLink && !tripMapPeek ? (
        <ChevronRight
          className={`${mapPeekCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mt-1 shrink-0 text-gray-400`}
          aria-hidden
        />
      ) : null}
    </>
  );

  if (embedInItemLink) {
    return (
      <DiscoveryCardHostProfileNav
        card={card}
        embedInItemLink
        ariaLabel={`View ${hostName} profile`}
        className={`${shellClass} text-left hover:text-emerald-800`}
      >
        {inner}
      </DiscoveryCardHostProfileNav>
    );
  }

  if (hostPath) {
    return (
      <Link
        to={hostPath}
        onClick={() => onBeforeNavigate?.()}
        className={`${shellClass} group rounded-xl -mx-1 px-1 py-0.5 transition-colors hover:bg-neutral-50`}
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
        className={`${shellClass} w-full rounded-xl -mx-1 px-1 py-0.5 text-left hover:bg-neutral-50`}
      >
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
};