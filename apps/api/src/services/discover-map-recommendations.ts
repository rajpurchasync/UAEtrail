import {
  BWL_EXPLORE_MAP_SOURCE,
  DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION,
  type DiscoverMapRecommendationsDTO,
  type DiscoverMapRecommendationRowDTO,
  type DiscoverRecommendationSignal,
} from '@uaetrail/shared-types';
import { listPublishedActivitiesForExploreMapFromMongo } from '../lib/activity-read-assembler.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import { listActiveLocationsForExploreMap } from '../lib/location-query.js';
import { rankMapExploreActivity } from './matching/rank-map-explore.js';
import { rankMapExplorePlace } from './matching/rank-map-explore-place.js';
import { loadRecommendationWishlistContext } from './matching/recommendation-wishlist-context.js';

const DEFAULT_LIMIT = 8;
const ACTIVITY_SCAN = 160;
const PLACE_SCAN = 100;

type RankedRow = {
  exploreItemId: string;
  score: number;
  signals: DiscoverRecommendationSignal[];
  title: string;
  source: DiscoverMapRecommendationRowDTO['source'];
  startAt: string | null;
};

export const loadDiscoverMapRecommendations = async (input: {
  viewerUserId?: string | null;
  limit?: number;
  viewerGeo?: { lat: number; lng: number } | null;
}): Promise<DiscoverMapRecommendationsDTO> => {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), 20);
  const nowMs = Date.now();

  const buddyUserIds = new Set<string>();
  if (input.viewerUserId) {
    const buddies = await listBuddiesForUser(input.viewerUserId, 200);
    for (const buddy of buddies) buddyUserIds.add(buddy.userId);
  }

  const wishlist = await loadRecommendationWishlistContext(input.viewerUserId);

  const [activities, locationPage] = await Promise.all([
    listPublishedActivitiesForExploreMapFromMongo(ACTIVITY_SCAN),
    listActiveLocationsForExploreMap(PLACE_SCAN),
  ]);

  const activityRows: RankedRow[] = [];
  for (const activity of activities) {
    const ranked = rankMapExploreActivity({
      activity,
      buddyUserIds,
      wishlistLocationIds: wishlist.locationIds,
      wishlistAreaIds: wishlist.areaIds,
      nowMs,
      viewerGeo: input.viewerGeo,
    });
    if (!ranked) continue;
    activityRows.push({
      exploreItemId: ranked.exploreItemId,
      score: ranked.score,
      signals: ranked.signals,
      title: activity.title,
      source: BWL_EXPLORE_MAP_SOURCE.ACTIVITY,
      startAt: activity.startAt ? activity.startAt.toISOString() : null,
    });
  }

  const placeRows: RankedRow[] = [];
  for (const location of locationPage.items) {
    const ranked = rankMapExplorePlace({
      location,
      wishlistLocationIds: wishlist.locationIds,
      wishlistAreaIds: wishlist.areaIds,
      viewerGeo: input.viewerGeo,
    });
    if (!ranked) continue;
    placeRows.push({
      exploreItemId: ranked.exploreItemId,
      score: ranked.score,
      signals: ranked.signals,
      title: ranked.title,
      source: BWL_EXPLORE_MAP_SOURCE.PLACE,
      startAt: null,
    });
  }

  const ranked = [...activityRows, ...placeRows]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const rows: DiscoverMapRecommendationRowDTO[] = ranked.map((row) => ({
    exploreItemId: row.exploreItemId,
    source: row.source,
    title: row.title,
    startAt: row.startAt,
    score: row.score,
    signals: row.signals,
  }));

  return {
    schemaVersion: DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION,
    surface: 'map',
    rows,
  };
};