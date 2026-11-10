import type { ReactNode, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type DiscoveryPosterOverlayNavProps = {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
  /** List thumb wraps the poster in a single item link — use button + stopPropagation. */
  embedInItemLink?: boolean;
  onBeforeNavigate?: () => void;
  guestGated?: boolean;
  onGuestGatedAction?: () => void;
};

/** Host / venue chips on poster banners — map peek and list thumbnails. */
export const DiscoveryPosterOverlayNav = ({
  to,
  children,
  className = '',
  ariaLabel,
  embedInItemLink = false,
  onBeforeNavigate,
  guestGated = false,
  onGuestGatedAction,
}: DiscoveryPosterOverlayNavProps) => {
  const navigate = useNavigate();

  const onActivate = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (guestGated) {
      onGuestGatedAction?.();
      return;
    }
    onBeforeNavigate?.();
    navigate(to);
  };

  if (embedInItemLink || guestGated) {
    return (
      <button type="button" className={className} aria-label={ariaLabel} onClick={onActivate}>
        {children}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onBeforeNavigate?.();
      }}
    >
      {children}
    </Link>
  );
};
