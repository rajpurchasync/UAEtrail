import { useQuery } from '@tanstack/react-query';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';

const inboxUnreadKey = (userId: string) => ['inbox-unread', userId] as const;

/** Total unread DM count for bottom nav badge. */
export const useInboxUnreadCount = (): number => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: user ? inboxUnreadKey(user.id) : ['inbox-unread', 'anonymous'],
    queryFn: async () => {
      const res = await api.getConversations();
      return res.data.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);
    },
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data ?? 0;
};
