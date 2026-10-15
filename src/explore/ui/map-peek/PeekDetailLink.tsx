import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';

export type PeekDetailLinkProps = {
  card: DiscoveryCardModel;
  label: string;
  className: string;
  hrefOverride?: string;
  joinStateLoading?: boolean;
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
};

/** Pin summary → entity detail — one access contract for activities, places, shops. */
export const PeekDetailLink = ({
  card,
  label,
  className,
  hrefOverride,
  joinStateLoading = false,
  onGuestGatedAction,
  onBeforeNavigate,
}: PeekDetailLinkProps) => {
  const fallbackHref = (hrefOverride ?? card.path)?.trim();
  if (!fallbackHref) return null;

  const access = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading,
  });
  if (!access || access.kind === 'members_only') return null;

  if (access.kind === 'guest_gate') {
    if (onGuestGatedAction) {
      return (
        <button type="button" onClick={onGuestGatedAction} className={className}>
          {label}
        </button>
      );
    }
    return (
      <Link to={fallbackHref} className={className} onClick={() => onBeforeNavigate?.()}>
        {label}
      </Link>
    );
  }

  if (access.kind === 'profile_gate' || access.kind === 'upgrade_gate') {
    return (
      <Link to={access.href} className={className} onClick={() => onBeforeNavigate?.()}>
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={hrefOverride ?? access.href ?? fallbackHref}
      className={className}
      onClick={() => onBeforeNavigate?.()}
    >
      {label}
    </Link>
  );
};
