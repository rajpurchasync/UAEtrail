import { useQuery } from '@tanstack/react-query';
import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import { fetchMeBuddies, fetchMeBuddyRequests } from './activityInviteClientApi';
import { fetchMeFollowingMembers } from './memberPeopleClientApi';
import { meBuddiesNetworkQueryKey, meFollowingMembersQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export type MeBuddiesNetworkData = {
  buddies: BuddySummaryDTO[];
  incomingRequests: BuddyRequestDTO[];
  outgoingRequests: BuddyRequestDTO[];
};

const fetchMeBuddiesNetwork = async (): Promise<MeBuddiesNetworkData> => {
  const [buddyList, incoming, outgoing] = await Promise.all([
    fetchMeBuddies(),
    fetchMeBuddyRequests('incoming'),
    fetchMeBuddyRequests('outgoing'),
  ]);
  return {
    buddies: buddyList,
    incomingRequests: incoming.filter((request) => request.status === 'pending'),
    outgoingRequests: outgoing.filter((request) => request.status === 'pending'),
  };
};

export const useMeBuddiesNetwork = (enabled = true) => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? meBuddiesNetworkQueryKey(user.id) : ['me', 'buddies-network', ''],
    queryFn: fetchMeBuddiesNetwork,
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  });

  return {
    buddies: query.data?.buddies ?? [],
    incomingRequests: query.data?.incomingRequests ?? [],
    outgoingRequests: query.data?.outgoingRequests ?? [],
    loading: query.data === undefined && (query.isPending || query.isFetching),
    error: query.error instanceof Error ? query.error.message : query.isError ? 'Failed to load friends' : null,
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
    error: query.error instanceof Error ? query.error.message : query.isError ? 'Failed to load following' : null,
    refetch: query.refetch,
  };
};
