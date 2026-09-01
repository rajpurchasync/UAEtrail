import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { NotificationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { inferNotificationPath } from '../utils/notificationRouting';

export const AdminNotifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeNotifications(1);
      setNotifications(res.data);
      setUnreadCount(res.unreadCount ?? res.data.filter((item) => !item.isRead).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => undefined);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
    syncUnreadBadge();
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    syncUnreadBadge();
  };

  const openNotification = async (notif: NotificationDTO) => {
    if (!notif.isRead) {
      await markRead(notif.id);
    }
    navigate(inferNotificationPath(notif, { preferAdminRoutes: true }));
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">Platform alerts and moderation updates</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="bg-white border rounded-lg overflow-hidden">
          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => void openNotification(notif)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" aria-hidden />
                    )}
                    <div className={`flex-1 min-w-0 ${notif.isRead ? '' : 'pl-0'}`}>
                      <p className="font-medium text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
