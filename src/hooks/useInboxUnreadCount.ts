import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchUnreadInboxSlice, unreadInboxSliceQueryKey } from './useMessagesInbox';

/** Total unread count for the bottom nav badge. Shares the Messages unread cache. */
export const useInboxUnreadCount = (): number => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: user ? unreadInboxSliceQueryKey(user.id) : ['messages-inbox', 'anonymous', 'unread'],
    queryFn: fetchUnreadInboxSlice,
    select: (slice) =>
      slice.conversations.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0) +
      slice.threads.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0),
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data ?? 0;
};
