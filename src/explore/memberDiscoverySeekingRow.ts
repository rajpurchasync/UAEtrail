import type { MemberDiscoverySeekingRowDTO } from '@uaetrail/shared-types';
import { exploreSeekingMapItemPath } from '@uaetrail/shared-types';
import { explorePath } from './routing';

export const activityIdFromExploreMapItemId = (exploreItemId: string): string | null => {
  const id = exploreItemId.trim();
  if (!id.startsWith('activity:')) return null;
  const activityId = id.slice('activity:'.length).trim();
  return activityId.length > 0 ? activityId : null;
};

/** Deep link to map list + pin peek — `activity:` when published; inbound `demand:` preserved. */
export const exploreMapItemPathFromSeekingRow = (row: MemberDiscoverySeekingRowDTO): string => {
  const activityId = activityIdFromExploreMapItemId(row.exploreItemId);
  if (activityId) {
    return exploreSeekingMapItemPath({
      intentId: row.participantIntentId,
      activityId,
    });
  }
  if (row.exploreItemId.startsWith('demand:')) {
    return explorePath({ pin: row.exploreItemId, list: true, panel: 'activities' });
  }
  return explorePath({ list: true, panel: 'activities' });
};
