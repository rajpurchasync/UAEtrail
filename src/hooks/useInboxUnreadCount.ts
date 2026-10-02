import { useQuery } from '@tanstack/react-query';
import { messagingApi } from '../messaging';
import { useAuth } from '../context/AuthContext';

const inboxUnreadKey = (userId: string) => ['inbox-unread', userId] as const;

/** Total unread DM count for bottom nav badge. */
export const useInboxUnreadCount = (): number => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: user ? inboxUnreadKey(user.id) : ['inbox-unread', 'anonymous'],
    queryFn: async () => {
      const res = await messagingApi.getInbox();
      const direct = res.data.direct.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0);
      const groups = res.data.groups.reduce((sum, row) => sum + (row.chatPreview.unreadCount ?? 0), 0);
      return direct + groups;
    },
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data ?? 0;
};
