import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchUnreadInboxSlice, unreadInboxSliceQueryKey } from './useMessagesInbox';
import { useAuthSessionReady } from './useAuthSessionReady';

/** Total unread count for the bottom nav badge. Shares the Messages unread cache. */
export const useInboxUnreadCount = (): number => {
  const { user } = useAuth();
  const authSessionReady = useAuthSessionReady();

  const { data } = useQuery({
    queryKey: user ? unreadInboxSliceQueryKey(user.id) : ['messages-inbox', 'anonymous', 'unread'],
    queryFn: fetchUnreadInboxSlice,
    select: (slice) =>
      slice.conversations.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0) +
      slice.threads.reduce((sum, row) => sum + (row.unreadCount ?? 0), 0),
    enabled: Boolean(user) && authSessionReady,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data ?? 0;
};
