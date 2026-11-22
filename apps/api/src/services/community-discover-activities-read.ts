import type { CommunityDiscoverActivitiesDTO } from '@uaetrail/shared-types';
import {
  listPublishedPastActivitiesByDiscoverCommunity,
  listPublishedUpcomingActivitiesByDiscoverCommunity,
} from '../lib/activities-store.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateByIds } from '../lib/activity-private-store.js';
import { findPublicCommunityBySlug } from '../lib/community-groups-store.js';
import { ApiError } from '../lib/api-error.js';

export const loadExploreCommunityDiscoverActivities = async (
  slug: string,
  limit = 12
): Promise<CommunityDiscoverActivitiesDTO> => {
  const community = await findPublicCommunityBySlug(slug);
  if (!community) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }

  const [upcomingRows, pastRows] = await Promise.all([
    listPublishedUpcomingActivitiesByDiscoverCommunity(community.id, limit),
    listPublishedPastActivitiesByDiscoverCommunity(community.id, limit),
  ]);

  const allIds = [...upcomingRows, ...pastRows].map((row) => row.id);
  const privateById = await findActivityPrivateByIds(allIds);

  const toDto = (rows: typeof upcomingRows) =>
    rows.map((event) =>
      buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null })
    );

  return {
    upcoming: toDto(upcomingRows),
    past: toDto(pastRows),
  };
};