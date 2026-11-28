import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { distanceMeters, type ViewerFix } from '../list/browse/placeDistance';

export const HOME_SUGGESTED_TRIP_LIMIT = 4;

/** Published outings guests and members can open from Home — not crew pins or rideshare-only. */
export const isMemberHomePlannedTripItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'activity' && item.activityMode !== 'seeking' && item.kind !== 'rideshare';

const itemDistanceMeters = (item: ExploreMapItemDTO, geo: ViewerFix): number => {
  if (item.latitude == null || item.longitude == null) return Number.POSITIVE_INFINITY;
  return distanceMeters(geo, item.latitude, item.longitude);
};

const recommendationRank = (ids: readonly string[] | undefined): Map<string, number> => {
  const rank = new Map<string, number>();
  (ids ?? []).forEach((id, index) => rank.set(id, index));
  return rank;
};

/**
 * Nearest hosted activities first; server recommendations break ties at similar distance.
 */
export const buildMemberHomePlannedTripPool = (
  catalog: ExploreMapItemDTO[],
  recommendationIds: readonly string[] | undefined,
  geo: ViewerFix
): ExploreMapItemDTO[] => {
  const activities = catalog.filter(isMemberHomePlannedTripItem);
  if (activities.length === 0) return [];

  const recRank = recommendationRank(recommendationIds);

  return [...activities]
    .sort((a, b) => {
      const distA = itemDistanceMeters(a, geo);
      const distB = itemDistanceMeters(b, geo);
      if (distA !== distB) return distA - distB;
      const rankA = recRank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rankB = recRank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    })
    .slice(0, HOME_SUGGESTED_TRIP_LIMIT);
};