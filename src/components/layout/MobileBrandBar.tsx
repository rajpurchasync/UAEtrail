import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mountain } from 'lucide-react';
import { MobileMenuButton } from './MobileMenu';
import { ProfileAvatarLink } from './ProfileAvatarLink';
import { NotificationBellPopover } from './NotificationBellPopover';

interface MobileBrandBarProps {
  tone?: 'light' | 'default';
  className?: string;
  backTo?: string;
  backLabel?: string;
  /** Show hamburger on desktop (banner chrome pages like Profile). */
  menuOnDesktop?: boolean;
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
  desktopAction,
}: MobileBrandBarProps) => (
  <div className={`flex justify-between items-center gap-3 ${className}`}>
    <div className="flex items-center gap-2 min-w-0">
      {backTo && (
        <Link
          to={backTo}
          aria-label={backLabel}
          className={`hidden md:inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-0 sm:px-3 sm:justify-start shrink-0 transition-colors active:scale-95 ${
            tone === 'light'
              ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
              : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.25} />
          <span className="hidden sm:inline text-[15px] font-medium">{backLabel}</span>
        </Link>
      )}
      <Link to="/" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
          <Mountain className="w-4 h-4 text-white" />
        </div>
        <span
          className={`text-base font-bold tracking-tight truncate ${
            tone === 'light' ? 'text-white' : 'text-gray-900'
          }`}
        >
          UAE Trail
        </span>
      </Link>
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {desktopAction && <div className="hidden md:flex items-center">{desktopAction}</div>}
      <ProfileAvatarLink tone={tone} />
      <NotificationBellPopover tone={tone} />
      <MobileMenuButton tone={tone} showOnDesktop={menuOnDesktop} />
    </div>
  </div>
);
