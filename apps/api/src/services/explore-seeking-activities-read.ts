import { exploreMapItemIsSeeking, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';

/**
 * Published `activityMode: seeking` rows for people-discovery **Looking for** (and list Buddies).
 * Same assembler as `GET /explore/map`, filtered server-side — not a separate storage read.
 */
export const loadExploreSeekingActivitiesForViewer = async (input: {
  viewerUserId: string | null;
  userRole?: string | null;
}): Promise<ExploreMapItemDTO[]> => {
  const items = await loadExploreMapItemsForMemberEngagement(input);
  return items.filter(
    (item) => exploreMapItemIsSeeking(item) && item.viewerAccess?.exposure !== 'none'
  );
};
