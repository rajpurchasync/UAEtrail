import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { resolvePeekDetailAccess } from '../../access/resolvePeekDetailAccess';

type ExplorePeekDetailLinkProps = {
  card: ExploreCardModel;
  label: string;
  className: string;
  /** Same gate as detail (e.g. shop review path) — defaults to `card.path`. */
  hrefOverride?: string;
  joinStateLoading?: boolean;
  onGuestGatedAction?: () => void;
  /** Close map peek before client navigation (keeps map state in sync). */
  onBeforeNavigate?: () => void;
};

/** Peek title and detail links — one CTA contract for activities, rideshare, shops, venues. */
export const ExplorePeekDetailLink = ({
  card,
  label,
  className,
  hrefOverride,
  joinStateLoading = false,
  onGuestGatedAction,
  onBeforeNavigate,
}: ExplorePeekDetailLinkProps) => {
  const fallbackHref = (hrefOverride ?? card.path)?.trim();
  if (!fallbackHref) return null;

  const access = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading,
  });
  if (!access || access.kind === 'members_only') return null;

  if (access.kind === 'guest_gate') {
    return (
      <button type="button" onClick={onGuestGatedAction} className={className}>
        {label}
      </button>
    );
  }

  if (access.kind === 'profile_gate' || access.kind === 'upgrade_gate') {
    return (
      <Link
        to={access.href}
        className={className}
        onClick={() => onBeforeNavigate?.()}
      >
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
