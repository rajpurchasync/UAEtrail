import type { MemberDiscoverySeekingRowDTO } from '@uaetrail/shared-types';
import { exploreMapItemSharePath } from './routing';

export const activityIdFromExploreMapItemId = (exploreItemId: string): string | null => {
  const id = exploreItemId.trim();
  if (!id.startsWith('activity:')) return null;
  const activityId = id.slice('activity:'.length).trim();
  return activityId.length > 0 ? activityId : null;
};

/** Deep link to map list + pin peek — same contract as explore cards (not `/activity` hub). */
export const exploreMapItemPathFromSeekingRow = (row: MemberDiscoverySeekingRowDTO): string =>
  exploreMapItemSharePath(row.exploreItemId, {
    intentId: row.participantIntentId,
    activityId: activityIdFromExploreMapItemId(row.exploreItemId),
  });
