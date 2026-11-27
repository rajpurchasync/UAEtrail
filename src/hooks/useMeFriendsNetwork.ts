import { useQuery } from '@tanstack/react-query';
import type { FriendRequestDTO, FriendSummaryDTO } from '@uaetrail/shared-types';
import { fetchMeFriends, fetchMeFriendRequests } from './activityInviteClientApi';
import { fetchMeFollowingMembers } from './memberPeopleClientApi';
import { meFriendsNetworkQueryKey, meFollowingMembersQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export type MeFriendsNetworkData = {
  friends: FriendSummaryDTO[];
  incomingRequests: FriendRequestDTO[];
  outgoingRequests: FriendRequestDTO[];
};

const fetchMeFriendsNetwork = async (): Promise<MeFriendsNetworkData> => {
  const [friendList, incoming, outgoing] = await Promise.all([
    fetchMeFriends(),
    fetchMeFriendRequests('incoming'),
    fetchMeFriendRequests('outgoing'),
  ]);
  return {
    friends: friendList,
    incomingRequests: incoming.filter((request) => request.status === 'pending'),
    outgoingRequests: outgoing.filter((request) => request.status === 'pending'),
  };
};

export const useMeFriendsNetwork = (enabled = true) => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? meFriendsNetworkQueryKey(user.id) : ['me', 'friends-network', ''],
    queryFn: fetchMeFriendsNetwork,
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  });

  return {
    friends: query.data?.friends ?? [],
    incomingRequests: query.data?.incomingRequests ?? [],
    outgoingRequests: query.data?.outgoingRequests ?? [],
    loading: query.data === undefined && (query.isPending || query.isFetching),
    error:
      query.error instanceof Error
        ? query.error.message
        : query.isError
          ? 'Failed to load friends'
          : null,
    refetch: query.refetch,
  };
};

export const useMeFollowingMembers = (enabled = true) => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? meFollowingMembersQueryKey(user.id) : ['me', 'following-members', ''],
    queryFn: fetchMeFollowingMembers,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });

  return {
    following: query.data ?? [],
    loading: query.data === undefined && (query.isPending || query.isFetching),
    error:
      query.error instanceof Error
        ? query.error.message
        : query.isError
          ? 'Failed to load following'
          : null,
    refetch: query.refetch,
  };
};