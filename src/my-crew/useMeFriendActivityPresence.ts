import { useQuery } from '@tanstack/react-query';
import type { FriendActivityPresenceRowDTO } from '@uaetrail/shared-types';
import { useAuth } from '@/context/AuthContext';
import { fetchMeFriendActivityPresence } from '@/hooks/activityInviteClientApi';
import { meFriendActivityPresenceQueryKey } from '@/hooks/clientQueryKeys';

export const useMeFriendActivityPresence = (enabled = true) => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? meFriendActivityPresenceQueryKey(user.id) : ['me', 'friends-activity-presence', ''],
    queryFn: fetchMeFriendActivityPresence,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });

  const byUserId = new Map<string, FriendActivityPresenceRowDTO>();
  for (const row of query.data ?? []) {
    byUserId.set(row.friend.userId, row);
  }

  return {
    rows: query.data ?? [],
    byUserId,
    loading: query.data === undefined && (query.isPending || query.isFetching),
    refetch: query.refetch,
  };
};