import { ReactNode } from 'react';

import {
  MOBILE_CONSUMER_HEADER_BOTTOM_PAD,
  MOBILE_CONSUMER_HEADER_HORIZONTAL_PAD,
  MOBILE_CONSUMER_HEADER_TOP_INSET,
  MOBILE_PRODUCT_HEADER_COMPOSE_IMMERSIVE,
  MOBILE_PRODUCT_HEADER_FROSTED,
  MOBILE_PRODUCT_HEADER_REST,
} from '../../config/consumerScrollChrome';
import { useComposeImmersiveChrome } from '@/discovery/discoverySessionExploreComposeImmersiveChrome';
import { useAppScrollFrostedHeader } from '../../hooks/useAppScrollFrostedHeader';
import { MobileBackButton } from './MobileBackButton';
import { MobileConsumerIdentityBar } from './MobileConsumerIdentityBar';

interface MobileUnifiedTabHeaderProps {
  trailing?: ReactNode;
  profileActive?: boolean;
  center?: ReactNode;
  /** Override default profile identity (e.g. compact avatar on discover home). */
  leading?: ReactNode;
  /** Profile hub sub-screens (Plans, History, …) — match ConsumerShell back chrome. */
  leadingBack?: { fallbackTo: string; label: string; backBehavior?: 'history' | 'fallback' };
}

/** Layout-mounted tab header — same identity row as list (`MobileConsumerIdentityBar`). */
export const MobileUnifiedTabHeader = ({
  trailing,
  profileActive = false,
  center,
  leading: leadingOverride,
  leadingBack,
}: MobileUnifiedTabHeaderProps) => {
  const headerFrosted = useAppScrollFrostedHeader();
  const { immersiveCompose } = useComposeImmersiveChrome();
  const headerSurfaceClass = immersiveCompose
    ? MOBILE_PRODUCT_HEADER_COMPOSE_IMMERSIVE
    : headerFrosted
      ? MOBILE_PRODUCT_HEADER_FROSTED
      : MOBILE_PRODUCT_HEADER_REST;

  const leading =
    leadingOverride ??
    (leadingBack ? (
      <MobileBackButton
        fallbackTo={leadingBack.fallbackTo}
        label={leadingBack.label}
        backBehavior={leadingBack.backBehavior ?? 'fallback'}
        className="min-h-[36px] py-0 -ml-1"
      />
    ) : undefined);

  return (
    <header
      data-consumer-chrome-header
      className={`relative z-[1100] shrink-0 md:hidden ${
        MOBILE_CONSUMER_HEADER_TOP_INSET
      } ${MOBILE_CONSUMER_HEADER_BOTTOM_PAD} ${MOBILE_CONSUMER_HEADER_HORIZONTAL_PAD} ${
        immersiveCompose ? 'pointer-events-none' : ''
      } ${headerSurfaceClass}`}
    >
      <MobileConsumerIdentityBar
        leading={leading}
        center={center}
        profileActive={profileActive}
        trailing={trailing}
      />
    </header>
  );
};
