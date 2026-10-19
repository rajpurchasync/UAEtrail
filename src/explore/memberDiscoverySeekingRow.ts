import type { MemberDiscoverySeekingRowDTO } from '@uaetrail/shared-types';
import { exploreSeekingMapItemPath } from '@uaetrail/shared-types';
import { explorePath } from './routing';

export const activityIdFromExploreMapItemId = (exploreItemId: string): string | null => {
  const id = exploreItemId.trim();
  if (!id.startsWith('activity:')) return null;
  const activityId = id.slice('activity:'.length).trim();
  return activityId.length > 0 ? activityId : null;
};

/** Deep link to map list + pin peek — `activity:` only. */
export const exploreMapItemPathFromSeekingRow = (row: MemberDiscoverySeekingRowDTO): string => {
  const activityId = activityIdFromExploreMapItemId(row.exploreItemId);
  if (activityId) {
    return exploreSeekingMapItemPath({
      intentId: row.participantIntentId,
      activityId,
    });
  }
  return explorePath({ list: true, panel: 'activities' });
};
