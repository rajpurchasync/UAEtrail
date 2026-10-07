import type { BuddySummaryDTO } from './buddy-connection.js';

/** Activity row on the explore map payload. */
export type ExploreActivityRefDTO = {
  exploreItemId: string;
  activityId: string;
  title: string;
};

/** Accepted buddy + hosting or joining on a visible published activity. */
export type BuddyActivityPresenceRowDTO = {
  buddy: BuddySummaryDTO;
  hosting: ExploreActivityRefDTO | null;
  joining: ExploreActivityRefDTO | null;
};

export type BuddyActivityPresenceDTO = {
  rows: BuddyActivityPresenceRowDTO[];
};
