import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { NotificationDTO } from '@uaetrail/shared-types';
import { markAllMeNotificationsRead, markNotificationReadById } from '../../hooks/notificationInboxApi';
import {
  useAdminNotificationsConsole,
  type AdminNotificationsConsolePayload,
} from '../../hooks/useAdminConsoleQueries';
import { adminNotificationsConsoleQueryKey } from '../../hooks/clientQueryKeys';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { invalidateNotificationUnreadBadge } from '../../utils/notificationBadge';
import { notificationReasonLine } from '../../utils/notificationDisplay';
import { inferNotificationPath } from '../../utils/notificationRouting';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { formatAdminDateTime } from '../../utils/formatAdminDate';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';

const READ_FILTER_OPTIONS = [
  { value: 'unread' as const, label: 'Unread' },
  { value: 'read' as const, label: 'Read' },
];

export const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const {
    data: inbox,
    isPending: loading,
    error: loadError,
  } = useAdminNotificationsConsole(page, pageSize);
  const notifications = useMemo(() => inbox?.notifications ?? [], [inbox?.notifications]);
  const total = inbox?.total ?? 0;
  const unreadCount = inbox?.unreadCount ?? 0;
  const error =
    loadError instanceof Error ? loadError.message : loadError ? 'Failed to load notifications' : null;
  const queryKey = adminNotificationsConsoleQueryKey(page, pageSize);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const syncUnreadBadge = () => {
    if (!user?.id) return;
    void invalidateNotificationUnreadBadge(queryClient, user.id);
  };

  const patchInbox = (updater: (prev: AdminNotificationsConsolePayload) => AdminNotificationsConsolePayload) => {
    queryClient.setQueryData<AdminNotificationsConsolePayload>(queryKey, (prev) => {
      const base = prev ?? { notifications: [], total: 0, unreadCount: 0 };
      return updater(base);
    });
  };

  const filtered = useMemo(() => {
    return notifications.filter((notif) => {
      if (readFilter === 'unread' && notif.isRead) return false;
      if (readFilter === 'read' && !notif.isRead) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        notif.title.toLowerCase().includes(q) ||
        notif.body.toLowerCase().includes(q) ||
        (notificationReasonLine(notif) ?? '').toLowerCase().includes(q)
      );
    });
  }, [notifications, readFilter, search]);

  const markRead = async (id: string) => {
    await markNotificationReadById(id).catch(() => undefined);
    patchInbox((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
    syncUnreadBadge();
  };

  const markAllRead = async () => {
    await markAllMeNotificationsRead().catch(() => undefined);
    patchInbox((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
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

        <AdminFilterBar
          onClear={() => {
            setSearch('');
            setReadFilter('');
          }}
        >
          <label className="text-xs text-neutral-500">
            Search
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or body…"
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
            />
          </label>
          <AppSelect
            value={readFilter}
            onChange={setReadFilter}
            options={READ_FILTER_OPTIONS}
            placeholder="All (read + unread)"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by read status"
          />
        </AdminFilterBar>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="bg-white border rounded-lg overflow-hidden">
          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {notifications.length === 0 ? 'No notifications yet' : 'No notifications match these filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((notif) => {
                const reasonLine = notificationReasonLine(notif);
                return (
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
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-medium text-gray-900">{notif.title}</p>
                        <p className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                          {formatAdminDateTime(notif.createdAt, clock)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                      {reasonLine && (
                        <p className="text-xs font-medium text-gray-700 mt-2">{reasonLine}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
          )}
        </div>
        <AdminTablePager
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
