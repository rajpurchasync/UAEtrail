import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { NOTIFICATIONS_PATH } from '../../config/routingCatalog';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';

const baseClass =
  'relative flex shrink-0 items-center justify-center rounded-full transition-colors active:scale-95';

type NotificationHeaderLinkProps = {
  /** Tab header (mobile map chrome). */
  variant?: 'tab' | 'desktop';
  className?: string;
};

/** Notifications bell with unread badge — mobile tab header and desktop nav. */
export const NotificationHeaderLink = ({ variant = 'tab', className = '' }: NotificationHeaderLinkProps) => {
  const unreadCount = useNotificationUnreadCount();

  const sizeClass =
    variant === 'desktop'
      ? 'h-10 w-10 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      : 'touch-target-icon h-10 w-10 justify-self-end text-gray-800';

  return (
    <Link to={NOTIFICATIONS_PATH} className={`${baseClass} ${sizeClass} ${className}`} aria-label="Notifications">
      <Bell className={variant === 'desktop' ? 'h-5 w-5' : 'h-6 w-6'} strokeWidth={2.25} />
      {unreadCount > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ${
            variant === 'desktop' ? 'ring-2 ring-white' : 'ring-2 ring-white'
          }`}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
