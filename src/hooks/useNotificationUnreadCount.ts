import { useQuery } from '@tanstack/react-query';
import { fetchMeNotificationsPage } from './notificationInboxApi';
import { useAuth } from '../context/AuthContext';
import { notificationUnreadBadgeKey } from '../utils/notificationBadge';

export const useNotificationUnreadCount = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: notificationUnreadBadgeKey(user?.id),
    queryFn: async () => {
      const res = await fetchMeNotificationsPage(1);
      return res.unreadCount;
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data ?? 0;
};
