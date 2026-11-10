import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { NotificationDTO } from '@uaetrail/shared-types';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchMeNotificationsPage,
  markAllMeNotificationsRead,
  markNotificationReadById,
} from '../../hooks/notificationInboxApi';
import { useAuth } from '../../context/AuthContext';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { invalidateNotificationUnreadBadge } from '../../utils/notificationBadge';
import { sortNotificationsNewestFirst } from '../../utils/notificationCategories';
import { NotificationListItem } from '../notifications/NotificationListItem';
import { inferNotificationPath } from '../../utils/notificationRouting';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { APP_SETTINGS_NOTIFICATIONS_PATH } from '../../config/routingCatalog';
import { UiTooltip } from '../ui/UiTooltip';

interface NotificationBellPopoverProps {
  tone?: 'default' | 'light';
  /** Matches consumer header chrome (map tab vs marketing desktop bar). */
  triggerVariant?: 'tab' | 'desktop';
  className?: string;
  viewAllPath?: string;
  preferAdminRoutes?: boolean;
}

const UNREAD_PREVIEW_LIMIT = 12;

export const NotificationBellPopover = ({
  tone = 'default',
  triggerVariant = 'tab',
  className = '',
  viewAllPath = APP_SETTINGS_NOTIFICATIONS_PATH,
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetchMeNotificationsPage(1);
      setNotifications(sortNotificationsNewestFirst(res.data));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unreadPreview = useMemo(
    () => notifications.filter((notif) => !notif.isRead).slice(0, UNREAD_PREVIEW_LIMIT),
    [notifications]
  );

  const unreadTotal = useMemo(
    () => notifications.filter((notif) => !notif.isRead).length,
    [notifications]
  );

  const markAllRead = async () => {
    await markAllMeNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    syncUnreadBadge();
  };

  const openSignIn = () => {
    const { href } = buildSignInRedirect(location);
    navigate(href);
  };

  const handleItemClick = async (notif: NotificationDTO) => {
    await markNotificationReadById(notif.id).catch(() => undefined);
    setNotifications((prev) => prev.filter((item) => item.id !== notif.id));
    syncUnreadBadge();
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
  }, [open, loadNotifications]);

  const toneClass =
    tone === 'light'
      ? 'text-white bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25'
      : triggerVariant === 'desktop'
        ? 'text-gray-600 bg-transparent border border-transparent hover:bg-gray-50 hover:text-gray-900'
        : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100';

  const bellSizeClass = triggerVariant === 'desktop' ? 'h-10 w-10' : 'h-11 w-11';

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <UiTooltip label={user ? 'Notifications' : 'Sign in to view notifications'}>
      <button
        type="button"
        onClick={() => {
          if (!user) {
            openSignIn();
            return;
          }
          setOpen((current) => !current);
        }}
        className={`relative ${bellSizeClass} shrink-0 inline-flex items-center justify-center rounded-full transition-colors active:scale-95 ${toneClass}`}
        aria-label={user ? 'Open unread notifications' : 'Sign in to view notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className={triggerVariant === 'desktop' ? 'w-5 h-5' : 'w-5 h-5'} strokeWidth={2.25} />
        {user && badgeUnreadCount > 0 && (
          <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {badgeUnreadCount > 99 ? '99+' : badgeUnreadCount}
          </span>
        )}
      </button>
      </UiTooltip>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1250] bg-black/25 md:bg-transparent"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Unread notifications"
            className="fixed z-[1300] left-3 right-3 top-[calc(var(--safe-top)+3.25rem)] max-h-[min(70dvh,28rem)] flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-w-[calc(100vw-2rem)]"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/70 shrink-0">
              <div>
                <p className="text-sm font-bold text-gray-900">Unread</p>
                {unreadTotal > 0 ? (
                  <p className="text-xs text-gray-500 mt-0.5">{unreadTotal} notification{unreadTotal === 1 ? '' : 's'}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {unreadTotal > 0 && (
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
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-touch touch-pan-y p-3 space-y-2 bg-neutral-50/50">
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : unreadPreview.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">You&apos;re all caught up</p>
                </div>
              ) : (
                unreadPreview.map((notif) => (
                  <NotificationListItem
                    key={notif.id}
                    notif={notif}
                    compact
                    showTimestamp
                    onClick={() => void handleItemClick(notif)}
                  />
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(viewAllPath);
              }}
              className="w-full shrink-0 text-left px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50/60 border-t border-gray-100"
            >
              Notification history & settings
            </button>
          </div>
        </>
      )}
    </div>
  );
};
