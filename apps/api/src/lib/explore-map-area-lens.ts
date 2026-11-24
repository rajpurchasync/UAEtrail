/** Destination hub rollups for `/destination/:slug` — curated hub is a label, not an explore map pin. */
import type { AreaDTO, ExploreAreaLensStatsDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  destinationHubPath,
  exploreAreaLensStatsSummary,
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsHostedActivity,
  exploreMapItemIsRetiredSeekingActivity,
  isFacilityMapSource,
  isPlaceMapSource,
  isFacilityPlaceKind,
  placeKindFromLocationRow,
  resolveDestinationId,
} from '@uaetrail/shared-types';

const emptyStats = (): ExploreAreaLensStatsDTO => ({
  hostedActivities: 0,
  availabilityPins: 0,
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
    const areaId = resolveDestinationId(item);
    if (!areaId) continue;
    const stats = bucket(areaId);

    if (exploreMapItemIsRetiredSeekingActivity(item)) continue;
    if (exploreMapItemIsAvailabilityCatalog(item)) {
      stats.availabilityPins += 1;
      continue;
    }
    if (exploreMapItemIsHostedActivity(item)) {
      stats.hostedActivities += 1;
      continue;
    }
    if (isFacilityMapSource(item.source)) {
      stats.facilities += 1;
      continue;
    }
    if (isPlaceMapSource(item.source)) {
      if (item.placeKind && isFacilityPlaceKind(item.placeKind)) {
        stats.facilities += 1;
        continue;
      }
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

/** @deprecated CPC-5 — facility rollups come from explore items (`placeKind` on map pins). */
export const mergeFacilityStatsFromLocations = (
  statsByArea: Map<string, ExploreAreaLensStatsDTO>,
  locations: Array<{ destinationId?: string | null; activityType: string; tags?: string[] | null }>
): void => {
  for (const location of locations) {
    const areaId = location.destinationId?.trim();
    if (!areaId) continue;
    const kind = placeKindFromLocationRow({
      activityType: location.activityType,
      tags: location.tags,
    });
    if (!isFacilityPlaceKind(kind)) continue;
    const stats = statsByArea.get(areaId) ?? emptyStats();
    stats.facilities += 1;
    statsByArea.set(areaId, stats);
  }
};

/**
 * @deprecated Do not emit onto `GET /explore/map`. Area has no pin.
 * Kept for hub-page stats tests until Area hub reads stats without a synthetic map row.
 */
export const buildExploreAreaLensItems = (
  publishedAreas: AreaDTO[],
  catalogItems: ExploreMapItemDTO[]
): ExploreMapItemDTO[] => {
  const statsByArea = accumulateAreaLensStats(catalogItems);
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
      path: destinationHubPath(area.slug),
      destinationId: area.id,
      destinationSlug: area.slug,
      destinationName: area.name,
      areaLensStats: stats,
    });
  }

  return rows;
};
