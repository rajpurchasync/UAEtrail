import type { MemberDiscoverySeekingRowDTO } from '@uaetrail/shared-types';
import { exploreSeekingMapItemPath } from '@uaetrail/shared-types';

export const activityIdFromExploreMapItemId = (exploreItemId: string): string | null => {
  const id = exploreItemId.trim();
  if (!id.startsWith('activity:')) return null;
  const activityId = id.slice('activity:'.length).trim();
  return activityId.length > 0 ? activityId : null;
};

/** Deep link to map list + pin peek — prefers `activity:` when M1 row exists (R4). */
export const exploreMapItemPathFromSeekingRow = (row: MemberDiscoverySeekingRowDTO): string =>
  exploreSeekingMapItemPath({
    intentId: row.participantIntentId,
    activityId: activityIdFromExploreMapItemId(row.exploreItemId),
  });
