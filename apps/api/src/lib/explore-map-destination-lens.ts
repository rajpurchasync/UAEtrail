/** Destination hub rollups for `/destination/:slug` — curated hub is a label, not an explore map pin. */
import type { ExploreDestinationLensStatsDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  exploreDestinationLensStatsSummary,
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsHostedActivity,
  exploreMapItemIsRetiredSeekingActivity,
  isFacilityMapSource,
  isPlaceMapSource,
  isFacilityPlaceKind,
  placeKindFromLocationRow,
  resolveDestinationId,
} from '@uaetrail/shared-types';

const emptyStats = (): ExploreDestinationLensStatsDTO => ({
  hostedActivities: 0,
  availabilityPins: 0,
  trailSpots: 0,
  campSpots: 0,
  facilities: 0,
  shops: 0,
});

export const accumulateDestinationHubStats = (
  items: ExploreMapItemDTO[]
): Map<string, ExploreDestinationLensStatsDTO> => {
  const byDestinationId = new Map<string, ExploreDestinationLensStatsDTO>();

  const bucket = (destinationId: string): ExploreDestinationLensStatsDTO => {
    const existing = byDestinationId.get(destinationId);
    if (existing) return existing;
    const stats = emptyStats();
    byDestinationId.set(destinationId, stats);
    return stats;
  };

  for (const item of items) {
    if (item.kind === 'destination') continue;
    const destinationId = resolveDestinationId(item);
    if (!destinationId) continue;
    const stats = bucket(destinationId);

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

  return byDestinationId;
};

/** @deprecated CPC-5 — facility rollups come from explore items (`placeKind` on map pins). */
export const mergeFacilityStatsFromLocations = (
  statsByDestinationId: Map<string, ExploreDestinationLensStatsDTO>,
  locations: Array<{ destinationId?: string | null; activityType: string; tags?: string[] | null }>
): void => {
  for (const location of locations) {
    const destinationId = location.destinationId?.trim();
    if (!destinationId) continue;
    const kind = placeKindFromLocationRow({
      activityType: location.activityType,
      tags: location.tags,
    });
    if (!isFacilityPlaceKind(kind)) continue;
    const stats = statsByDestinationId.get(destinationId) ?? emptyStats();
    stats.facilities += 1;
    statsByDestinationId.set(destinationId, stats);
  }
};

export const destinationHubStatsSummaryForDestination = (
  destinationId: string,
  catalogItems: ExploreMapItemDTO[]
): { stats: ExploreDestinationLensStatsDTO; summary: string } => {
  const stats = accumulateDestinationHubStats(catalogItems).get(destinationId) ?? emptyStats();
  return { stats, summary: exploreDestinationLensStatsSummary(stats) };
};
