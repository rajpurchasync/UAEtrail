import type { BuddyActivityPresenceRowDTO } from '@uaetrail/shared-types';

export type BuddyActivityPresenceRow = BuddyActivityPresenceRowDTO;

export const buddyUserIdsFromPresenceRows = (rows: BuddyActivityPresenceRow[]): Set<string> =>
  new Set(rows.map((row) => row.buddy.userId));
