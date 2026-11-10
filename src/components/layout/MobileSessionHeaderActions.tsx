import { Link, useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { APP_SETTINGS_NOTIFICATIONS_PATH } from '../../config/routingCatalog';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { SecureAvatar } from '../ui/SecureAvatar';

interface MobileSessionHeaderActionsProps {
  /** `bar` = icons on solid white header; `light` = on dark hero; `overlay` = floating on map; `default` = white circles. */
  tone?: 'light' | 'default' | 'overlay' | 'bar';
  className?: string;
  /** When bell + menu live in {@link ConsumerHeaderActions}. */
  profileOnly?: boolean;
}

/** Signed-in: notifications + profile. Signed-out: user icon → sign in. */
export const MobileSessionHeaderActions = ({
  tone = 'default',
  className = '',
  profileOnly = false,
}: MobileSessionHeaderActionsProps) => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const unreadCount = useNotificationUnreadCount();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  const floatingActionClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,.14)] backdrop-blur-md';

  const profileActionClass =
    tone === 'bar'
      ? 'flex h-10 w-10 shrink-0 items-center justify-center'
      : tone === 'light'
        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm ring-1 ring-neutral-200/70'
        : tone === 'overlay'
          ? floatingActionClass
          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200/80';

  const notificationActionClass =
    tone === 'bar'
      ? 'relative flex h-10 w-10 shrink-0 items-center justify-center'
      : tone === 'overlay'
        ? floatingActionClass
        : 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full';

  const bellClass =
    tone === 'light' ? 'h-[18px] w-[18px] text-white' : 'h-[18px] w-[18px] text-gray-800';
  const badgeRingClass =
    tone === 'light'
      ? 'ring-2 ring-black/40'
      : tone === 'bar' || tone === 'overlay'
        ? 'ring-2 ring-white'
        : 'ring-2 ring-white';

  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      {user && !profileOnly && (
        <Link
          to={APP_SETTINGS_NOTIFICATIONS_PATH}
          className={notificationActionClass}
          aria-label="Notifications"
        >
          <Bell className={bellClass} strokeWidth={2.25} />
          {unreadCount > 0 && (
            <span className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ${badgeRingClass}`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      )}
      <Link
        to={user ? '/profile' : signInHref}
        className={profileActionClass}
        aria-label={user ? 'Profile' : 'Sign in or sign up'}
      >
        {user ? (
          <SecureAvatar
            src={user.avatarUrl}
            name={user.displayName || user.email || 'Account'}
            className="h-10 w-10 text-xs"
          />
        ) : (
          <User className="h-5 w-5 text-gray-700" strokeWidth={2.25} />
        )}
      </Link>
    </div>
  );
};
