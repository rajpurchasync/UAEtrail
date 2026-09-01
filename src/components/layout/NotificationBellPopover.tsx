import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { NotificationDTO } from '@uaetrail/shared-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { invalidateNotificationUnreadBadge } from '../../utils/notificationBadge';
import { inferNotificationPath } from '../../utils/notificationRouting';

interface NotificationBellPopoverProps {
  tone?: 'default' | 'light';
  className?: string;
  viewAllPath?: string;
  preferAdminRoutes?: boolean;
}

export const NotificationBellPopover = ({
  tone = 'default',
  className = '',
  viewAllPath = '/notifications',
  preferAdminRoutes = false,
}: NotificationBellPopoverProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const badgeUnreadCount = useNotificationUnreadCount();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const res = await api.getMeNotifications(1);
      setNotifications(res.data);
      setUnreadCount(res.unreadCount ?? res.data.filter((n) => !n.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    syncUnreadBadge();
  };

  const openSignIn = () => {
    navigate('/signin', { state: { from: location.pathname } });
  };

  const handleItemClick = async (notif: NotificationDTO) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id).catch(() => undefined);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      syncUnreadBadge();
    }

    setOpen(false);
    navigate(inferNotificationPath(notif, { preferAdminRoutes }));
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      const target = event.target;
      if (target instanceof Node && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [open]);

  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!user) {
            openSignIn();
            return;
          }
          setOpen((current) => !current);
        }}
        className={`relative h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 ${toneClass}`}
        aria-label={user ? 'Open notifications' : 'Sign in to view notifications'}
      >
        <Bell className="w-5 h-5" strokeWidth={2.25} />
        {user && badgeUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {badgeUnreadCount > 99 ? '99+' : badgeUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-[80] overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/70">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => void handleItemClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50/70 transition-colors ${
                    !notif.isRead ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.body}</p>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(viewAllPath);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50/60 border-t border-gray-100"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
};