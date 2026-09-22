import { Link, useLocation } from 'react-router-dom';
import { Bell, Mountain, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { SecureAvatar } from '../../components/ui/SecureAvatar';

const headerIconSlot = 'touch-target-icon flex shrink-0 items-center justify-center';

/** Explore map — profile, brand, notifications. */
export const MobileExploreHeader = () => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const unreadCount = useNotificationUnreadCount();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  return (
    <header className="relative z-[1100] shrink-0 border-b border-neutral-200/80 bg-white pb-2 pt-[calc(var(--safe-top)+4px)] lg:hidden">
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-3">
        <Link
          to={user ? '/profile' : signInHref}
          className={`${headerIconSlot} justify-self-start`}
          aria-label={user ? 'Profile' : 'Sign in or sign up'}
        >
          {user ? (
            <SecureAvatar
              src={user.avatarUrl}
              name={user.displayName || user.email || 'Account'}
              className="h-10 w-10 text-xs"
            />
          ) : (
            <User className="h-6 w-6 text-gray-700" strokeWidth={2.25} />
          )}
        </Link>

        <Link
          to={EXPLORE_MAP_PATH}
          className="flex min-w-0 items-center justify-center gap-1.5 justify-self-center"
          aria-label="Explore map"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700">
            <Mountain className="h-4 w-4 text-white" strokeWidth={2.25} />
          </div>
          <span className="truncate text-sm font-bold tracking-tight text-gray-900">UAE Trail</span>
        </Link>

        {user ? (
          <Link
            to="/notifications"
            className={`${headerIconSlot} relative justify-self-end`}
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6 text-gray-800" strokeWidth={2.25} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ) : (
          <span className="touch-target-icon shrink-0 justify-self-end" aria-hidden />
        )}
      </div>
    </header>
  );
};
