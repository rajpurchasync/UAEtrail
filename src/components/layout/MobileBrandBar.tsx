import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import { ConsumerHeaderActions } from './ConsumerHeaderActions';
import { MobileMenuButton, MobileUserMenuButton } from './MobileMenu';
import { MobileSessionHeaderActions } from './MobileSessionHeaderActions';
import { MobileBackButton } from '../mobile/MobileBackButton';

interface MobileBrandBarProps {
  tone?: 'light' | 'default';
  className?: string;
  backTo?: string;
  backLabel?: string;
  /** Show hamburger on desktop (banner chrome pages like Profile). */
  menuOnDesktop?: boolean;
  /** `user` = visitor menu; `session` = map-style bell + profile; `landingJoin` = Join free pill (guest hero). */
  menuVariant?: 'hamburger' | 'user' | 'session' | 'landingJoin';
  /** Required when `menuVariant` is `landingJoin`. */
  joinHref?: string;
  /** Logo only on narrow screens (guest landing hero). */
  compactBrand?: boolean;
  /** Extra action (e.g. cart) shown next to the menu button on desktop only. */
  desktopAction?: ReactNode;
}

/** Logo + hamburger row for banner headers (PWA). */
export const MobileBrandBar = ({
  tone = 'light',
  className = '',
  backTo,
  backLabel = 'Back',
  menuOnDesktop = false,
  menuVariant = 'hamburger',
  joinHref,
  compactBrand = false,
  desktopAction,
}: MobileBrandBarProps) => (
  <div className={`flex items-center justify-between gap-2 sm:gap-3 ${className}`}>
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {backTo && (
        <MobileBackButton
          fallbackTo={backTo}
          label={backLabel}
          tone={tone === 'light' ? 'light' : 'default'}
          className={`hidden md:inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-0 sm:px-3 sm:justify-start shrink-0 ${
            tone === 'light'
              ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
              : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100'
          }`}
        />
      )}
      <Link to="/" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
          <Mountain className="w-4 h-4 text-white" />
        </div>
        <span
          className={`text-sm font-bold tracking-tight whitespace-nowrap sm:text-base ${
            compactBrand ? 'max-[359px]:hidden' : ''
          } ${tone === 'light' ? 'text-white' : 'text-gray-900'}`}
        >
          UAE Trail
        </span>
      </Link>
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {desktopAction && <div className="hidden md:flex items-center">{desktopAction}</div>}
      {menuVariant === 'session' ? (
        <>
          <ConsumerHeaderActions tone={tone} showOnDesktop={menuOnDesktop} />
          <MobileSessionHeaderActions tone={tone} profileOnly />
        </>
      ) : menuVariant === 'landingJoin' && joinHref ? (
        <Link
          to={joinHref}
          className={`landing-hero-join-pill inline-flex h-9 min-h-9 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-semibold leading-none transition-colors active:scale-[0.97] sm:px-3.5 sm:text-xs ${
            tone === 'light'
              ? 'border border-white/28 bg-white/12 text-white backdrop-blur-sm hover:bg-white/20'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          {PRODUCT_JOIN_CTA}
        </Link>
      ) : menuVariant === 'user' ? (
        <MobileUserMenuButton tone={tone} showOnDesktop={menuOnDesktop} />
      ) : (
        <MobileMenuButton tone={tone} showOnDesktop={menuOnDesktop} />
      )}
    </div>
  </div>
);
