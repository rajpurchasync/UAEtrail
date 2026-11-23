import type { FriendSummaryDTO } from './friend-connection.js';

/** Activity row on the explore map payload. */
export type ExploreActivityRefDTO = {
  exploreItemId: string;
  activityId: string;
  title: string;
};

/** Friend + hosting or joining on a visible published activity. */
export type FriendActivityPresenceRowDTO = {
  friend: FriendSummaryDTO;
  hosting: ExploreActivityRefDTO | null;
  joining: ExploreActivityRefDTO | null;
};

export type FriendActivityPresenceDTO = {
  rows: FriendActivityPresenceRowDTO[];
};
