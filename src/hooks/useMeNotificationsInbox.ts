import type { NotificationDTO } from '@uaetrail/shared-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMeNotificationsPage,
  markAllMeNotificationsRead,
  markNotificationReadById,
} from './notificationInboxApi';
import { meNotificationsPageQueryKey } from './clientQueryKeys';
import { sortNotificationsNewestFirst } from '../utils/notificationCategories';
import { invalidateNotificationUnreadBadge } from '../utils/notificationBadge';
import { useAuthSessionReady } from './useAuthSessionReady';

type InboxPayload = {
  notifications: NotificationDTO[];
  unreadCount: number;
};

export const useMeNotificationsInbox = (userId: string | undefined, enabled: boolean) => {
  const queryClient = useQueryClient();
  const queryKey = meNotificationsPageQueryKey(1);
  const authSessionReady = useAuthSessionReady();

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    enabled: enabled && Boolean(userId) && authSessionReady,
    queryFn: async (): Promise<InboxPayload> => {
      const page = await fetchMeNotificationsPage(1);
      return {
        notifications: sortNotificationsNewestFirst(page.data),
        unreadCount: page.unreadCount,
      };
    },
    staleTime: 30_000,
  });

  const syncUnreadBadge = () => {
    if (!userId) return;
    void invalidateNotificationUnreadBadge(queryClient, userId);
  };

  const setInbox = (updater: (prev: InboxPayload) => InboxPayload) => {
    queryClient.setQueryData<InboxPayload>(queryKey, (prev) => {
      const base = prev ?? { notifications: [], unreadCount: 0 };
      return updater(base);
    });
  };

  const markRead = async (id: string) => {
    await markNotificationReadById(id).catch(() => undefined);
    setInbox((prev) => ({
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
    syncUnreadBadge();
  };

  const markAllRead = async () => {
    await markAllMeNotificationsRead().catch(() => undefined);
    setInbox((prev) => ({
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    syncUnreadBadge();
  };

  const reload = async () => {
    await refetch();
  };

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    loading: data === undefined && (isPending || isFetching),
    error: isError
      ? error instanceof Error
        ? error.message
        : "Couldn't load notifications — tap to retry."
      : null,
    markRead,
    markAllRead,
    reload,
  };
};
