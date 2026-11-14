import type { ReactNode } from 'react';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
  type DiscoveryCardModel,
} from './discoveryCardModel';
import { DiscoveryPosterOverlayNav } from './DiscoveryPosterOverlayNav';

type DiscoveryCardHostProfileNavProps = {
  card: DiscoveryCardModel;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Inside a parent item link — navigate via button + stopPropagation. */
  embedInItemLink?: boolean;
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
};

/** Host profile affordance on discovery cards (map peek banner, list rows, posters). */
export const DiscoveryCardHostProfileNav = ({
  card,
  children,
  className = '',
  ariaLabel = 'View host profile',
  embedInItemLink = false,
  onGuestGatedAction,
  onBeforeNavigate,
}: DiscoveryCardHostProfileNavProps) => {
  const hostProfilePath = resolveDiscoveryCardHostProfilePath(card);
  const isGuest = Boolean(onGuestGatedAction);
  const canOpen = hostProfilePath
    ? discoveryCardCanOpenHostProfile(card, { isGuest })
    : false;
  const guestGated = isGuest && Boolean(hostProfilePath);

  if (!hostProfilePath || (!canOpen && !guestGated)) {
    return <span className={className}>{children}</span>;
  }

  return (
    <DiscoveryPosterOverlayNav
      to={hostProfilePath}
      className={className}
      ariaLabel={ariaLabel}
      embedInItemLink={embedInItemLink}
      guestGated={guestGated}
      onGuestGatedAction={onGuestGatedAction}
      onBeforeNavigate={onBeforeNavigate}
    >
      {children}
    </DiscoveryPosterOverlayNav>
  );
};