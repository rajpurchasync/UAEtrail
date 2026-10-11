import type { AreaDTO, ExploreAreaLensStatsDTO, ExploreMapItemDTO, PlaceKind } from '@uaetrail/shared-types';
import {
  areaDetailPath,
  exploreAreaLensStatsSummary,
  exploreMapItemIsSeeking,
  isTimeBoundExploreMapItem,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';

const FACILITY_PLACE_KINDS = new Set<PlaceKind>([
  'toilet',
  'gas_station',
  'water_refill',
  'parking',
  'viewpoint',
  'picnic',
]);

const emptyStats = (): ExploreAreaLensStatsDTO => ({
  hostedActivities: 0,
  seekingPosts: 0,
  trailSpots: 0,
  campSpots: 0,
  facilities: 0,
  shops: 0,
});

const accumulateAreaLensStats = (items: ExploreMapItemDTO[]): Map<string, ExploreAreaLensStatsDTO> => {
  const byArea = new Map<string, ExploreAreaLensStatsDTO>();

  const bucket = (areaId: string): ExploreAreaLensStatsDTO => {
    const existing = byArea.get(areaId);
    if (existing) return existing;
    const stats = emptyStats();
    byArea.set(areaId, stats);
    return stats;
  };

  for (const item of items) {
    if (item.source === 'area') continue;
    const areaId = item.areaId?.trim();
    if (!areaId) continue;
    const stats = bucket(areaId);

    if (isTimeBoundExploreMapItem(item)) {
      if (exploreMapItemIsSeeking(item)) stats.seekingPosts += 1;
      else stats.hostedActivities += 1;
      continue;
    }
    if (item.source === 'venue') {
      if (item.kind === 'hiking') stats.trailSpots += 1;
      else if (item.kind === 'camping') stats.campSpots += 1;
      else if (item.kind === 'shop') stats.shops += 1;
      continue;
    }
    if (item.source === 'shop' && item.kind === 'shop') {
      stats.shops += 1;
    }
  }

  return byArea;
};

type LocationAreaRow = {
  areaId?: string | null;
  activityType: string;
  tags?: string[] | null;
};

/** Roll amenity / facility rows into area stats (map may not render them on Spots lens yet). */
export const mergeFacilityStatsFromLocations = (
  statsByArea: Map<string, ExploreAreaLensStatsDTO>,
  locations: LocationAreaRow[]
): void => {
  for (const location of locations) {
    const areaId = location.areaId?.trim();
    if (!areaId) continue;
    const kind = placeKindFromLocationRow({
      activityType: location.activityType,
      tags: location.tags,
    });
    if (!FACILITY_PLACE_KINDS.has(kind)) continue;
    const stats = statsByArea.get(areaId) ?? emptyStats();
    stats.facilities += 1;
    statsByArea.set(areaId, stats);
  }
};

/** Synthetic map rows for the Locations lens — area anchor + rollup stats. */
export const buildExploreAreaLensItems = (
  publishedAreas: AreaDTO[],
  catalogItems: ExploreMapItemDTO[],
  locations: LocationAreaRow[] = []
): ExploreMapItemDTO[] => {
  const statsByArea = accumulateAreaLensStats(catalogItems);
  mergeFacilityStatsFromLocations(statsByArea, locations);
  const rows: ExploreMapItemDTO[] = [];

  for (const area of publishedAreas) {
    const stats = statsByArea.get(area.id) ?? emptyStats();
    const subtitle = exploreAreaLensStatsSummary(stats);
    rows.push({
      id: `area:${area.slug}`,
      kind: 'area',
      source: 'area',
      title: area.name,
      subtitle,
      latitude: area.center.latitude,
      longitude: area.center.longitude,
      path: areaDetailPath(area.slug),
      areaId: area.id,
      areaSlug: area.slug,
      areaLensStats: stats,
    });
  }

  return rows;
};
