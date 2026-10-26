import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

import {
  MOBILE_PRODUCT_HEADER_COMPOSE_IMMERSIVE,
  MOBILE_PRODUCT_HEADER_FROSTED,
  MOBILE_PRODUCT_HEADER_REST,
} from '../../config/consumerScrollChrome';
import { useComposeImmersiveChrome } from '../../explore/create/ComposeImmersiveChromeContext';
import { useAppScrollFrostedHeader } from '../../hooks/useAppScrollFrostedHeader';
import { UaeTrailBrandMark } from '../layout/UaeTrailBrandMark';
import { MobileBackButton } from './MobileBackButton';
import { MobileProfileHeaderLink } from './MobileProfileHeaderLink';

export type MobileUnifiedTabHeaderCenter =
  | { kind: 'brand' }
  | { kind: 'title'; text: string };

interface MobileUnifiedTabHeaderProps {
  center: MobileUnifiedTabHeaderCenter;
  trailing?: ReactNode;
  profileActive?: boolean;
  /** Profile hub sub-screens (Plans, History, …) — match ConsumerShell back chrome. */
  leadingBack?: { fallbackTo: string; label: string; backBehavior?: 'history' | 'fallback' };
  /** Explore map — dismiss pin peek when tapping the brand control. */
  onExploreBrandClick?: () => void;
}

/** Single mobile tab header — avatar · brand or title · action (explore, profile, activities, messages). */
export const MobileUnifiedTabHeader = ({
  center,
  trailing,
  profileActive = false,
  leadingBack,
  onExploreBrandClick,
}: MobileUnifiedTabHeaderProps) => {
  const headerFrosted = useAppScrollFrostedHeader();
  const { immersiveCompose } = useComposeImmersiveChrome();
  const headerSurfaceClass = immersiveCompose
    ? MOBILE_PRODUCT_HEADER_COMPOSE_IMMERSIVE
    : headerFrosted
      ? MOBILE_PRODUCT_HEADER_FROSTED
      : MOBILE_PRODUCT_HEADER_REST;

  return (
    <header
      className={`relative z-[1100] shrink-0 pb-2 pt-[calc(var(--safe-top)+4px)] lg:hidden ${
        immersiveCompose ? 'pointer-events-none' : ''
      } ${headerSurfaceClass}`}
    >
      <div
        className={`grid items-center gap-2 px-3 ${
          leadingBack ? 'grid-cols-[minmax(72px,auto)_1fr_auto]' : 'grid-cols-[2.5rem_1fr_auto]'
        }`}
      >
        {leadingBack ? (
          <MobileBackButton
            fallbackTo={leadingBack.fallbackTo}
            label={leadingBack.label}
            backBehavior={leadingBack.backBehavior ?? 'history'}
            className="min-h-[36px] py-0 -ml-1"
          />
        ) : (
          <MobileProfileHeaderLink activeOnProfile={profileActive} />
        )}

        {center.kind === 'brand' ? (
          <Link
            to={EXPLORE_MAP_PATH}
            className="flex min-w-0 items-center justify-center gap-1.5 justify-self-center"
            aria-label="Explore map"
            onClick={() => onExploreBrandClick?.()}
          >
            <UaeTrailBrandMark />
          </Link>
        ) : (
          <h1 className="truncate text-center text-[17px] font-semibold text-neutral-900">{center.text}</h1>
        )}

        <div className="flex justify-end justify-self-end min-h-[2.5rem] items-center">
          {trailing ?? <span className="w-10" aria-hidden />}
        </div>
      </div>
    </header>
  );
};
