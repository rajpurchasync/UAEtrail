import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import {
  useMeBuddiesNetwork,
  useMeFollowingMembers,
  type MeBuddiesNetworkData,
} from './useMeBuddiesNetwork';

export type MeFriendsNetworkData = {
  friends: BuddySummaryDTO[];
  incomingRequests: BuddyRequestDTO[];
  outgoingRequests: BuddyRequestDTO[];
};

/** Product-facing friends roster — HTTP remains `GET /me/buddies` (BWL). */
export const useMeFriendsNetwork = (enabled = true) => {
  const wire = useMeBuddiesNetwork(enabled);
  return {
    friends: wire.buddies,
    incomingRequests: wire.incomingRequests,
    outgoingRequests: wire.outgoingRequests,
    loading: wire.loading,
    error: wire.error,
    refetch: wire.refetch,
  };
};

export { useMeFollowingMembers, type MeBuddiesNetworkData };