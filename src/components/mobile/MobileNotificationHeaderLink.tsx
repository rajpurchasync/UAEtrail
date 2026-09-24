import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';

const slotClass = 'touch-target-icon relative flex shrink-0 items-center justify-center justify-self-end';

/** Notifications entry — matches explore map header bell. */
export const MobileNotificationHeaderLink = () => {
  const unreadCount = useNotificationUnreadCount();

  return (
    <Link to="/notifications" className={slotClass} aria-label="Notifications">
      <Bell className="h-6 w-6 text-gray-800" strokeWidth={2.25} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
