export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/** Canonical sorted pair key for accepted buddy relationships. */
export const friendPairKey = (userA: string, userB: string): string =>
  [userA, userB].sort().join(':');

export const sortedFriendUserIds = (userA: string, userB: string): [string, string] => {
  const sorted = [userA, userB].sort();
  return [sorted[0]!, sorted[1]!];
};
