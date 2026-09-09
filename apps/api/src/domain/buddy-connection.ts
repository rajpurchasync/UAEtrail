export type BuddyRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/** Canonical sorted pair key for accepted buddy relationships. */
export const buddyPairKey = (userA: string, userB: string): string =>
  [userA, userB].sort().join(':');

export const sortedBuddyUserIds = (userA: string, userB: string): [string, string] => {
  const sorted = [userA, userB].sort();
  return [sorted[0]!, sorted[1]!];
};
